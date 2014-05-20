---
layout: post
status: publish
published: true
title: Setting up a MonoGame Mac Application with Xamarin Studio
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4761
wordpress_url: http://jamie.ly/wordpress/?p=4761
date: 2013-04-23 07:00:48.000000000 -04:00
categories:
- Software
tags:
- monodevelop
- tutorial
- game development
- xamarin studio
- mono
- monogame
- monomac
- dotnet
comments:
- id: 3374
  author: paytonrules
  author_email: twitter.1437841@example.com
  author_url: http://twitter.com/paytonrules
  date: '2013-04-23 22:22:33 -0400'
  date_gmt: '2013-04-24 03:22:33 -0400'
  content: '@jamiely There''s a mistake - the MonoGame Framework is in ~/Library/Application
    Support/blah blah - you forgot the Application Support.'
- id: 4716
  author: 'MonoGame on OSX | Development Blog: Sam Cartwright'
  author_email: ''
  author_url: http://samcsss.wordpress.com/2014/02/24/monogame-on-osx/
  date: '2014-02-24 07:24:29 -0500'
  date_gmt: '2014-02-24 12:24:29 -0500'
  content: '[&#8230;] MonoGame &ldquo;Hello World&rdquo; on Mac OS X and Xamarin Studio&nbsp;and&nbsp;Setting
    up a MonoGame Mac Application with Xamarin Studio [&#8230;]'
---

Intro
=====

I wanted to try out the [MonoGame
framework](https://monogame.codeplex.com/), which allows for creating
cross-platform games based on the XNA API. It wasn't straightforward for
me to run a Mac example (on OS X Mountain Lion). There were a number of
steps I had to go through to get things working, including combing
through forum posts. [The official instructions didn't seem to work, or
I couldn't find the most recent
update.](https://github.com/mono/MonoGame/wiki/Tutorials%3AInstalling-Prerequisites-on-MacOS-for-MonoMac-project)
It's for situations like these I wish I had the foresight to journal my
progress so that others don't get tripped up. Here are instructions I
followed (assembled after the fact, so I might've missed something) in
case someone finds them useful.

Steps
=====

1.  [Install Xamarin Studio](http://monodevelop.com/Download) and the
    specified dependencies (mono, gtk+).
2.  [Install the MonoGame project template for Xamarin
    Studio](https://monogame.codeplex.com/releases/view/102870)
3.  Install XCode from the Mac App Store.
4.  Open Xamarin Studio and perform updates.
5.  Create a new MonoGame Mac Project.
6.  In References, you may see MonoGame.Framework. As of 20130422, this
    is the incorrect framework. Command click on Refrences \> Edit
    References \> .Net Assembly \> Navigate to
    `~/Library/Application Support/XamarinStudio-4.0/LocalInstall/Addins/MonoDevelop.MonoGame.3.0.1/assemblies/MacOS/`
    and select `MonoGame.Framework.dll` \> Press OK. Delete the other
    reference to MonoGame.Framework.
7.  Running the project, you may get an error like:
    "Microsoft.Xna.Framework.Content.ContentLoadException: Could not
    load logo asset". Select `Content > logo.png` in the file pane at
    the left. Click the Gear Icon \> Build Action \> Select
    BundleResource.
8.  Run the project again. You may get an error like
    "System.MissingMethodException: Method not found:
    'MonoMac.AppKit.NSImage.AsCGImage'". [This forum post helped me to
    resolve
    it.](https://monogame.codeplex.com/discussions/437680#editor).
9.  Clone maccore to your code directory
    `git://github.com/mono/maccore.git`
10. Clone monomac to your code directory
    `git://github.com/mono/monomac.git`
11. Run `make` inside the monomac project.
12. If you get an error about missing `mdtool`, you can either install
    [an old version of MonoDevelop (\< 4) from
    SourceForge](http://sourceforge.net/projects/monodevelop.mirror/files/)
    or try to symlink mdtool to the location requested from
    `/Applications/Xamarin Studio.app/Contents/MacOS/mdtool`
13. Find one of the MonoMac.dll binaries from the samples directories,
    for example, at `samples/MonoMacGameWindow/bin/Debug/MonoMac.dll`,
    copy it somewhere you can use for your project.
14. Add the `MonoMac.dll` assembly to your project as a Reference, like
    we did for `MonoGame.Framework.dll`, above. Delete the other
    reference to MonoMac.
15. Now, when you run the project, a window with a blue background
    should appear, displaying the MonoGame logo.

