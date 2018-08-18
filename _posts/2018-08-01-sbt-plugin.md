---
layout: post
status: published
published: true
title: Writing an SBT Plugin to send Slack Messages
author: Jamie
date: 2018-08-01
categories:
- Software
tags:
- scala
- sbt
---

Intro
=====

[`sbt`](https://www.scala-sbt.org/) is the most popular build tool for
Scala; however, there are other options if you are interested [1]. If
you are not familiar with build tools, see the footnotes
<sup>[2](#build-tools)</sup>. If you are
familiar with maven, but not sbt, there are some big differences
<sup>[3](#sbt-maven-differences)</sup>

In this post, I discuss the process of writing an `sbt` plugin from
scratch. `sbt` uses a fancy Scala DSL for configuration. I was
definitely turned off at first, and I had trouble figuring out how
things worked, until I read
[sbt in Action](https://www.manning.com/books/sbt-in-action).

We will write a plugin to send a message to [Slack](https://slack.com/).
This may be useful to notify a room when there is a new version of a
library published, or when a task fails.

# Hello World

First, we will start with the hello world of `sbt` tasks with the
following requirements:

1. We want to have a new task called `slackNotify`.
2. When we invoke the task, we want it to print "Hello World"
3. It need not return anything.

We will start off with a blank directory to contain our project. In this
directory, we create a file `build.sbt`, containing the following.

```scala

// define a task key which is used to invoke the task we will write
val slackNotify = taskKey[Unit]("Sends a message to slack")

// binds the task key to a method invocation
slackNotify := {
  println("Hello world")
}
```

# Sending to Slack

Running `sbt slackNotify` from a command prompt will print `Hello
World`. Instead of doing this, we want to send a message to slack. We
will use an "Incoming WebHook" to do this. This is a URL which we can
POST messages to in order to send a Slack message. The process of
setting up
[Incoming WebHooks](https://get.slack.help/hc/en-us/articles/115005265063-Incoming-WebHooks-for-Slack)
is described in their help documentation.

A WebHook looks something like `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`.
In order to submit a POST request, we can create a `sendMessage` method
like this (and add it to `build.sbt`):

```scala

def sendMessage(hookUrl: String, msg: String): Unit = {
  import java.io.DataOutputStream
  import java.net.URL
  import java.net.HttpURLConnection
  import scala.util.Try

  // TODO: We should escape some message
  // characters to handle this properly
  val postData = s"""{"text": "$msg"}""".getBytes
  val conn = new URL(hookUrl).openConnection() .asInstanceOf[HttpURLConnection]
  conn.setDoOutput( true )
  conn.setInstanceFollowRedirects( false )
  conn.setRequestMethod( "POST" )
  conn.setRequestProperty( "Content-Type", "application/json")
  conn.setRequestProperty( "charset", "utf-8")
  conn.setRequestProperty( "Content-Length", postData.length.toString)
  conn.setUseCaches( false )

  val wr = new DataOutputStream( conn.getOutputStream )
  Try { wr.write(postData) }
  wr.close()
}
```

This will send a message to the Slack room configured in the WebHook.
Next, we need to hook this up to our `slackNotify` task:

```scala
// binds the task key to a
// method invocation
slackNotify := {
  sendMessage("Hello world")
}
```

That works, but it's not that useful since we have to hardcode the message.
Let's make the message an `sbt` setting.

```scala
// define a setting key that will store the message we want to
// send to Slack
val slackMessage = settingKey[String]("The message to send")

// Set the Slack message setting value
slackMessage := "Hello world"

// binds the task key to a method invocation
slackNotify := {
  // Whenever we want to use a setting inside another setting or task,
  // we need to use `.value`. This is a macro which allows the future
  // value of `slackMessage` to be used.
  sendMessage(slackMessage.value)
}
```

This is a ltitle better now, but we'll change the message to something
more useful.

```scala
// Set the Slack message setting value
slackMessage := s"Published new release ${version.value}"
```

We can use this whenever we publish a package.

# Creating a Plugin

This is handy for a single project, but now we will create a plugin that
can be used by other projects. First, we create a new project with the
following `build.sbt`:

```scala
sbtPlugin := true

name := "sbt-slack-notify"

version := "0.0"

organization := "myorg"
```

Next, in `src/main/scala/SlackNotify.scala`, we define a companion
object `SlackNotifyPlugin` that extends from `AutoPlugin`. This allows
sbt to automatically import the settings that we will define (rather
than having the user manually import them in the `build.sbt` file).

```scala
object SlackNotifyPlugin extends AutoPlugin {
  // this object can be named anything, as long as we import them into
  // the current scope below.
  object autoImport {
    val slackNotify = taskKey[Unit]( "Sends a message to slack")
    val slackMessage = settingKey[String]( "The message to send")
    val slackHookUrl = settingKey[String]( "The hook url")

    lazy val baseSlackNotifySettings: Seq[Setting[_]] =
      Def.settings(
        slackMessage := "",
        slackHookUrl := "",
        slackNotify := {
          sendMessage( slackHookUrl.value, slackMessage.value)
        }
    )
  }

  // import all the keys we defined
  import autoImport._

  // This plugin requires the JvmPlugin
  override def requires = sbt.plugins.JvmPlugin

  // this plugin must be specifically enabled
  override def trigger = allRequirements

  // a group of settings that are automatically added to projects.
  override val projectSettings = baseSlackNotifySettings

  // this is the method we defined before that sends to Slack
  protected def sendMessage( hookUrl: String, msg: String): Unit = ???
}
```

At this point, you could package the plugin and use it in another project by
adding it to that project's `project/plugins.sbt` file, like:

```scala
addSbtPlugin("myorg" % "sbt-slack-notify" % "LATEST_VERSION")
resolvers ++= Seq(
  "My Resolver" at "https://maven.myorg.example.com/snapshots"
)
```

# Testing

Our plugin is fairly straightforward, but testing it would be fairly
onerous, since we would need to package it, then possibly bump the
version in a project, and test it manually. Rather than do that, we will
create an automated test using the
[`scripted test framework`](https://www.scala-sbt.org/0.13/docs/Testing-sbt-plugins.html).

We'll follow the instructions on that page to first add the
`scripted-plugin` dependency to `project/scripted.sbt`:

```scala
libraryDependencies += { "org.scala-sbt" % "scripted-plugin" % sbtVersion.value }
```

and add the following to `build.sbt`:

```scala
ScriptedPlugin.scriptedSettings
scriptedLaunchOpts := { scriptedLaunchOpts.value ++
  Seq("-Xmx1024M", "-XX:MaxPermSize=256M", "-Dplugin.version=" + version.value)
}
scriptedBufferLog := false
```

Then we'll setup a sample project (that will use the plugin) in
`src/sbt-test/sbt-notify/simple`. Finally, we'll include a `test` script in
that directory:

```
# call the plugin
> slackNotify
```

Finally, we can run the command `scripted` in our plugin project to run
the test.

# Publishing

In order for others to use our plugin, we can publish it to a maven
repository. One such repository is Sonatype, which makes the
[Nexus](https://www.sonatype.com/nexus-repository-sonatype)
repository software.

[The process of signing up and publishing to Sonatype is described in
the sbt docs.](https://www.scala-sbt.org/1.x/docs/Using-Sonatype.html)
It's basically as follows:

* Signup for Sonatype
* Setup your project to use pgp and sonatype
* Publish a signed version of your artifact
* Promote the release from staging

There are a few nuances to the way I did things that I will describe.
Firstly, I use [Keybase](https://keybase.io/) for key management. So, I
want it to manage my PGP keys.

After setting up Keybase, you can create a new PGP key:

```bash
keybase pgp gen
```

In order for us to use [`sbt-pgp`](https://github.com/sbt/sbt-pgp), we
should install `gpg` locally.

```
brew install gnupg
```

And make sure to enable using `gpg` rather than Bouncy castyle by adding
`useGpg := true` to your `build.sbt` file.

Finally, we copy our pgp key to our local gpg databse:

```
keybase pgp export -s | gpg --allow-secret-key-import --import -
```

Although I used the `sbt-pgp` plugin described in the `sbt`
documentation, version `1.1.1` didn't work for
me. I used an older version `1.1.0`. When I was using the newer version,
I kept on getting error messages such as

```
[error] gpg: key 0000000: secret key without public key - skipped
[error] gpg: no default secret key: secret key not available
[error] gpg: signing failed: secret key not available
```

Once this was setup, I was able to run the following to stage my
signed artifact, and then release the artifact. My artifact appeared
in [Maven Central](https://search.maven.org/) less than a day
afterwards.

```
sbt publishSigned sonatypeRelease
```

# Conclusion

In this article, we built an `sbt` plugin to send a Slack message. We
learned how to test `sbt` plugins. We also pushed artifacts to Sonatype
for public consumption.


I've published this plugin on GitHub <https://github.com/jamiely/sbt-slack-notify>.

If you happen to want to use this plugin, you can do so by adding the
plugin to your `project/plugins.sbt` file:

```scala
addSbtPlugin("ly.jamie" % "sbt-slack-notify" % "0.3.1")

resolvers ++= Seq(Resolver.sonatypeRepo("releases"))
```

and then specifying some settings in your `build.sbt`:

```scala
lazy val root = (project in file(".")).
  settings(
    slackMessage := {
      s"Just pushed version ${version.value}"
    },
    slackRoom := "#someroom",
    slackHookUrl := "http://slackhookurl" // or something like System.getenv("SBTSLACKNOTIFY_SLACKHOOKURL")
  )
```

[1]: https://manuel.bernhardt.io/2018/04/19/quick-tour-build-tools-scala/
<a name="build-tools">2</a>: For those not familiar with build tools, they may provide one or a
number of these capabilities:

* Dependency management
  * Retrieving dependencies (and sub dependencies)
  * Keeping track of which dependencies are used
* Building
  * Can compile code
  * May manage language versions
* Packaging
  * Packages code into reusable library
  * Deploys package to some repository for consumption
* Pluggable architecture
  * Plugins can be easily created to add new features

In some ecosystems, these features are separated out into various tools.
In others, they are combined into one. Often there are multiple viable
options. In the Ruby ecosystem for example, there are separate tools:

* [gem](https://rubygems.org/) - A package format for libraries, and a
  way to retrieve and track dependencies.
* [bundler](https://bundler.io/) - A way to manage gems at a
  project-level.
* [rake](https://github.com/ruby/rake) - A make-like tool to specify
  build tasks and their dependencies

These all work together to provide the features above. In python, there is

* [easy_install](https://wiki.python.org/moin/EasyInstall) - Installs
  packages using a format called `egg`
* [pip](https://pypi.org/project/pip/) - The preferred way to install
  Python packages
* [virtualenv](https://virtualenv.pypa.io/en/stable/) - Provides
  isolated python environments, so you can run a specific version of
  python with a specific set of packages per project.

In JavaScript, there is: npm, grunt, gulp, and webpack, among others.
In Java, there is: ant, gradle, and maven, among others.

<a name="sbt-maven-differences">3</a>: For those who haven't used `sbt` but have used `mvn` (Maven), there are
two notable differences:

1. `sbt`'s configuration language is Scala rather than XML.
2. `sbt` has an interactive shell.

Here are some common commands you can use with `sbt`:

* `reload` - Reload the `sbt` configuration file (usually `build.sbt`).
* `update` - Pulls the most recent versions of the dependencies. This is
  useful for wildcard and SNAPSHOT dependencies.
* `compile` - Compiles the code
* `test` - Runs the tests
* `publish` - Pushes code artifacts like the `.jar` file to a
  repository.
