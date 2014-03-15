---
layout: post
title: "Deploying a Java Tomcat Application via Chef"
date:   2014-03-06 07:00:00
categories: programming
tags:
  - java
  - tomcat
  - chef
  - devops
  - jaxrs
comments: false
---

# Intro

We will write a simple REST application and deploy it to a server using
Chef by writing a cookbook and deploying via `knife solo`. 

This will seem like a lot of work to deploy an application, but makes
more sense if you are setting up a more distributed application. For
example, we could have 3 web servers running this application on Tomcat,
with another server setup to load balance using `nginx`, using `redis` as
a distributed cache, and `postgres` as the database, across two
servers setup with replication.

# Creating the project

Let's first create a dummy application to upload. This assumes you have
Maven installed. I was using Maven 3.1.1 with Apple Java 1.6.0_65. 
[The source for the jax-rs project is on Github](https://github.com/jamiely/tutorial-deploy-java-tomcat-war-using-chef_jaxrs).

```bash
mvn archetype:generate
```

You'll be presented with a list of options, which you may filter. Input
`jaxrs` and press enter to filter by that term. Enter the number
corresponding to the archetype
`org.apache.cxf.archetype:cxf-jaxrs-service`. Enter options for the
`groupId`, `artifactId`, and `version`, and accept the defaults. I
entered the following values:

```
groupId=ly.jamie
artifactId=jaxrs_tutorial
version=1.0.0
```

# The Route and Controller

This will generate a `controller` or `service bean` called `HelloWorld`.
`HelloWorld.java` is presented below, for reference.

```java
@Path("/hello")
public class HelloWorld {
  @GET
  @Path("/echo/{input}")
  @Produces("text/plain")
  public String ping(
    @PathParam("input") String input
    ) {
    return input;
  }
  // ...
}
```

For our purposes, all we really need to know from this file is that
there will be a route at the application context that looks like
`/hello/echo/***`, where, for GET requests, whatever is entered for the
asterisks will be echoed back. The annotations are specific to 
[JAX-RS](http://docs.oracle.com/javaee/6/tutorial/doc/giepu.html)
and explaining them is not in the scope of this article.

# Running the app

We can confirm our belief by running the web application. Although you
could build the war and deploy it to an application server, we'll take a
simpler approach using the 
[maven-tomcat7 plugin](http://tomcat.apache.org/maven-plugin-2.0/tomcat7-maven-plugin/). 

```bash
mvn tomcat7:run
```

Running the command above will run our application in its own instance
of Tomcat. After running the command, you'll see several logging
statements including something that looks like:

```
[INFO] Running war on http://localhost:13000/jaxrs-service
```

That will tell you the port and context of the application. 

# Sanity Check

Once the application is started, we can test the endpoint via `curl`.

```bash
curl -v localhost:13000/jaxrs-service/hello/echo/test

# * About to connect() to localhost port 13000 (#0)
# *   Trying ::1...
# * connected
# * Connected to localhost (::1) port 13000 (#0)
# > GET /jaxrs-service/hello/echo/test HTTP/1.1
# > User-Agent: curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8y zlib/1.2.5
# > Host: localhost:13000
# > Accept: */*
# > 
# < HTTP/1.1 200 OK
# < Server: Apache-Coyote/1.1
# < Date: Sat, 01 Mar 2014 19:52:57 GMT
# < Content-Type: text/plain
# < Content-Length: 4
# < 
# { [data not shown]
# * Connection #0 to host localhost left intact
# test* Closing connection #0
```

We can see in the last line that "test" was echoed, since it was entered
after the `echo/` in the URL.

# Starting the Cookbook

These next steps assume that you have setup your system for Chef. [The
final cookbook we develop below is available on Github](https://github.com/jamiely/tutorial-deploy-java-tomcat-war-using-chef_cookbook)

First, create a new cookbook template using
[Berkshelf](http://berkshelf.com/). Assuming we have have Ruby installed
(I am using ruby 2.0.0p247), we can grab this dependency by running the 
command `gem install berkshelf`. This will install the `berks` command,
which provides an easy way to create a cookbook.

```bash
berks cookbook jaxrs_tutorial
```

`cd` into the cookbook directory and run `bundle install` to install the
gems specified in the `Gemfile`.

Go into the `metadata.rb` file and specify that your cookbook depends on 
`java` and
[`application_java`](https://github.com/poise/application_java).

```ruby
depends 'java'
depends 'application_java', '~> 3.0.0'
```

We will use a custom version of the `application_java` cookbook that I
forked from the main version. Let's modify the `Berksfile` to point at
this version. The `Berksfile` should look something like this:

```ruby
site :opscode

cookbook 'apt'
cookbook 'application_java', 
  git: 'https://github.com/jamiely/application_java'

metadata
```

Now, we'll edit default recipe in `recipes/default.rb`. We'll make use
of the `java_webapp` and `tomcat` 
[LWRPs](http://docs.opscode.com/lwrp.html) 
that the `application_java` cookbook provides. 

```ruby
case node['platform']
when 'debian', 'ubuntu'
  include_recipe 'apt'
  package 'curl' # here for tests. Don't do this!
end
include_recipe 'java' # Need described below

application 'jaxrs_tutorial' do 
  path '/var/www/jaxrs_tutorial'
  repository 'http://nexus/jaxrs_tutorial-1.0.0.war'
  revision '1.0.0'
  scm_provider Chef::Provider::RemoteFile::Deploy

  # Handles war specifics and creates the `context.xml`
  java_webapp 
  tomcat # Symlinks the context.xml into $CATALINA_HOME
end
```

# How it works

The recipe above will create the application at the path
`/var/www/jaxrs_tutorial` with directories:

* current
* shared
* releases

Then, it will download the war from the URI given to the `repository`
method (this can be the path to the war in your Nexus) to the releases
directory to `releases/1.0.0`, and symlink the war to `current`.
Finally, it will install Tomcat (and Java) if they're not installed,
then create a `context.xml` file at
`$CATALINA_HOME/conf/Catalina/jaxrs_tutorial.xml`.

There are a few special notes about this recipe. 

Firstly, we **must** have allowed Chef to install Java for this recipe
to work (at least on CentOS). If we didn't we will probably get a
message about `keytool` not being found. This is because the default
Java package does not add the `keytool` tool inside `$JAVA_HOME/bin` to
the `$PATH`. However, if one uses Chef to manage it, `keytool` _will_ be
added the `$PATH` using the `alternatives` command. There is another way
to get around this error, by specifying the `keytool` path in attribute
`node['tomcat']['keytool']`. It's not actually necessary to specify in
the recipe itself. Instead, you could specify java before this cookbook
in the run list of the role or node you are operating on.

Secondly, note that the `java_webapp` LWRP may
accept a block to configure database parameters and to provide a custom
`context.xml` template. 

Thirdly, note the `package 'curl'` call in the first block. This is around
purely for tests, which will be described later, and installs the `curl`
command. When creating real cookbooks, you should create cookbooks just
for testing purposes, and add these to the run list in your
`.kitchen.yml` file, described later.

Lastly, we include the `apt` recipe if we're working on ubuntu so that
the apt repository gets updated. Otherwise, java installation might
fail.

# Making Things Configurable

Since we want some of the settings to be configurable, we'll swap them
out with cookbook `attributes`. Let's create a file `attributes/default.rb`
that looks like the following:

```ruby
default[:jaxrs_tutorial][:application_name] = 
  'jaxrs_tutorial'
default[:jaxrs_tutorial][:application_path] = 
  '/var/www/jaxrs_tutorial'
default[:jaxrs_tutorial][:application_version] = 
  '1.0.0'
default[:jaxrs_tutorial][:war_uri] = 
  'http://path_to_your_nexus/jaxrs_tutorial-1.0.0.war'
```

And the new `recipes/default.rb` using these attributes looks like:

```ruby
case node['platform']
when 'debian', 'ubuntu'
  include_recipe 'apt'
  package 'curl' # here for tests. Don't do this!
end

include_recipe 'java'

application node[:jaxrs_tutorial][:application_name] do 
  path node[:jaxrs_tutorial][:application_path]
  repository node[:jaxrs_tutorial][:war_uri]
  revision node[:jaxrs_tutorial][:application_version]
  scm_provider Chef::Provider::RemoteFile::Deploy

  java_webapp 
  tomcat
end
```

# Testing the Cookbook

Now that we're done with the cookbook, it'd be helpful to test it. We
can use `test-kitchen` to do so. It was installed when you ran 
`bundle install` earlier. `test-kitchen` allows us to integration test
our cookbook by spinning up a virtual machine. Using the default setup,
it'll use [Vagrant](http://vagrantup.com) to spin up the machine.

The Chef run is configured via the `.kitchen.yml` file that was created by
Berkshelf. Let's modify the file to change some of the attribute
settings for the default suite. These are attributes we will test for
later.

```yaml
suites:
  - name: default
    run_list:
      - recipe[jaxrs_tutorial::default]
    attributes:
      jaxrs_tutorial:
        application_name: 'jaxrs_tutorial'
        application_path: '/var/www/jaxrs_tutorial_test'
        war_uri: 'http://33.33.33.1:8999/jaxrs_tutorial-1.0.0.war'
```

For the war uri, you can specify a nexus URI. Alternatively, you could run a
web server on your host machine (which is reachable on the guest via
33.33.33.1). I ran the following command in my java project `target` directory
to do that: 

```bash
python -m SimpleHTTPServer 8999
```

If you have a web server installed locally, you may just want to drop
the war there.

Let's kick off the Chef run now by running the command below:

```bash
bundle exec kitchen converge centos
```

This will spin up a CentOS box for testing, and run our Chef recipe on
it. test-kitchen will spin up the machine, but we need to write a test.
Although there are many tests we could perform, let's perform two
tests directly relevant to what we're doing above. 

# Writing the Tests

Let's check that the application path exists, and we'll hit the `/echo`
endpoint and make sure that whatever we give it is echoed back. We'll
write the test using the [Bats](https://github.com/sstephenson/bats)
Bash testing framework. Here's the test:

```bash
# test/integration/default/bats/app_running.bats
@test "app folder exists" {
  ls /var/www/jaxrs_tutorial_test
}

@test "app is running" {
  HOST=localhost:8080
  URI=$HOST/jaxrs_tutorial/hello/echo/hello_world 
  curl $URI | grep -i 'hello_world'
}
```

We also need to add the `busser-bats` gem to our `Gemfile`. The
`Gemfile` should look something like this now:

```ruby
source 'https://rubygems.org'

gem 'berkshelf'
gem 'test-kitchen'
gem 'kitchen-vagrant'
gem 'busser-bats'
```

And make sure the gems are installed by running `bundle install` again.
Now, we can have the test run on the node we provisioned via the
command:

```bash
bundle exec kitchen verify centos
```

If we're confident that everything works, we can perform a full test on
both `CentOS` and `Ubuntu` at the same time using the command:

```bash
bundle exec kitchen test --parallel
```

# Deploying

Now that we have an application WAR and a corresponding Chef cookbook,
we can deploy the application via Chef Server, Hosted Chef, or Chef
Solo. I will briefly go over how to deploy using Chef Solo.

First, we want to install the [knife-solo
gem](http://matschaffer.github.io/knife-solo/). Then, in an empty
directory, run the command below to generate a **kitchen** directory
structure.

```
knife solo init .
```

Modify the created `Berksfile` to reference the cookbook we just
created.

Next, let's say we have ssh access to a node whose hostname is
`example.local`. Let's also assume we've setup key-based authentication
with that node. We can issue the following command to install Chef on
the node:

```bash
knife solo prepare user@example.local
```

We'll be asked to enter our `sudo` password. Once the preparation is
done, we can issue the following command to start the Chef run. We'll
have to enter our sudo password each time we run this command.

```bash
knife solo cook user@example.local
```

This will create a file `nodes/example.local.json`. Now, in the
`run_list` array in that file, we can add a reference to our cookbook.
We must also specify the WAR URI, as it is the only required attribute
of the cookbook.

```json
{
  "run_list": [
    "recipe[jaxrs_tutorial]"
  ],
  "jaxrs_tutorial": {
    "war_uri": "http://33.33.33.1:8999/jaxrs_tutorial-1.0.0.war"
  }
}
```

Finally, running `cook` again will run Chef on the node and run the
cookbook.

```bash
knife solo cook user@example.local
```

# Conclusion

We did a lot of things above! We created an application, a Chef cookbook
with a test, and deployed the application via Chef Solo. There are
_many_ things I glossed over and did not explain, since this is such a
big topic area. If you have any questions on the process or notice a
problem, feel free to reach out to me on twitter!

