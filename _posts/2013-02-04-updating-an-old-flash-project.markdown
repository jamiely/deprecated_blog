---
layout: post
status: publish
published: true
title: Updating an old Flash project
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4695
wordpress_url: http://jamie.ly/wordpress/?p=4695
date: 2013-02-04 07:00:06.000000000 -05:00
categories:
- Software
tags:
- tetris
- actionscript
- game programming
- game development
- guard
comments: []
---
[In 2004, I wrote an implementation of Tetris in ActionScript 2 using
Flash MX](http://jamie.ly/wordpress/programming/tetris/). I had thought
the source code lost until just a few months ago. Upon finding that
source, I immediately uploaded it to
[Github](https://github.com/jamiely/tetris-flash). Not too long
afterwards, I tried to upon the .fla in the most recent version of
Flash, without any luck. I have several projects that are stuck like
this. Not too long after I found my missing code cache, I updated a
different project, [a nonogram implementation in
ActionScript](https://github.com/jamiely/nonogram-flash), so that it
could be compiled solely with the command line ActionScript compiler,
mxmlc. The Tetris project was more difficult to update because there
were several assets created and stored in the .fla file, including some
graphics. I decided to remove the dependency on the .fla and create a
pure ActionScript application. Some of the first things I did were to
remove the fla from the project, and rearrange the source code into a
package. I created a [Makefile to run the compilation
command](https://github.com/jamiely/tetris-flash/blob/master/Makefile),
and [setup guard](https://github.com/guard/guard) to [watch the source
files, and rebuild the project upon change
detection](https://github.com/jamiely/tetris-flash/blob/master/Guardfile).
In addition to creating a package for all the source files, I also had
to create a class out of the code that originally ran as part of the
root MovieClip's actions. Luckily, I had saved this script externally,
and not inside of the .fla. I wrapped this in a Game class, and began
debugging. It took almost an hour to get the code to compile. Most of
the issues were related to the transition from the ActionScript 2 to
ActionScript 3. Some of the issues I ran into included:

-   MovieClip methods such as attachToMovieClip and createEmptyMovieClip
    were not available.
-   Warnings for functions without explicit return types
-   Use of "function(): Void" instead of "function(): void"
-   Warnings about lack of explicit types with variables
-   Changes to the scope of loop counter variables
-   Absence of the Key global
-   Changes to event binding

Once I had everything compiling, then I worked on run-time errors. These
included:

-   Changes to "this" resolution (mostly having to do with event
    binding)
-   Weird issues with static variables
-   Changes to property definitions, for example from .\_visible to
    .visible
-   Missing references referred to in Game.as (these were assets from
    the fla)

But part of this process was also getting familiar again with
ActionScript. For example, I learned that an empty MovieClip has no
width, even if you assign one explicitly. Guard was incredibly helpful
in resolving both the compile-time and run-time issues. I had the swf
reloading every few seconds until I got the game loop working. The end
result is shown below, compared to the old swf. The game is now pure
code, if somewhat uglier than it was. Mostly, I'm glad I can preserve
some of my work without being locked in by a vendor. [You can find the
source on Github](https://github.com/jamiely/tetris-flash), and a video
of the new app in operation [on Youtube](http://youtu.be/ChhGMjpxiTo).

[![Tetris Flash - 2004](http://jamie.ly/wordpress/wp-content/uploads/2009/05/tetris-157x300.gif)](http://jamie.ly/wordpress/wp-content/uploads/2009/05/tetris.gif)

Tetris Flash - 2004 

[![Tetris Flash Update](http://jamie.ly/wordpress/wp-content/uploads/2009/05/tetris-flash-4cc9abe-300x243.png)](http://jamie.ly/wordpress/wp-content/uploads/2009/05/tetris-flash-4cc9abe.png)

Tetris Flash Update 2013 

<iframe width="420" height="315" src="//www.youtube.com/embed/ChhGMjpxiTo" frameborder="0" allowfullscreen></iframe>
