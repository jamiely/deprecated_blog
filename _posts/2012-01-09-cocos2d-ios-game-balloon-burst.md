---
layout: post
status: publish
published: true
title: 'Cocos2d iOS Game: Balloon Burst'
author: Jamie
date: 2012-01-09
categories:
- Software
- Libraries
tags:
- game programming
- iPhone
- xcode
- iOS
- cocos2d
- iPad
- objective-c
- mobile development
comments: []
---

My employer gives us a week off for the holidays, so I'd been trying to
decide what to do with all of the time. Although I originally didn't
want to work on any programming projects, I wound up working on a few.
One of them was inspired by a play of the iOS game Train Yard. I was
paying particular attention to the loading screen when I noticed it had
been created using Cocos2d. I'd seen articles about the engine before,
so I decided to take another look at the Website. I was curious about
what other game engines were in popular use. Besides
[Unity](http://unity3d.com/), I didn't notice any that were more popular
than [Cocos2d](http://www.cocos2d-iphone.org). I decided to investigate
further and found a
[tutorial](http://www.cocos2d-iphone.org/wiki/doku.php/prog_guide:lesson_1._install_test)
on the site.

[![](http://jamie.ly/wordpress/wp-content/uploads/2012/11/Icon-72.png "cocos2d logo")](http://www.angelforge.org/wordpress/wp-content/uploads/2012/01/Icon-72.png)

Before I knew it, I was working through the tutorial. The API was
simple, straight-forward, and intuitive, and I was soon done. Still, I
wanted to use it for my own project. Unfortunately, the holidays were
winding down, and Spring term classes will start soon, so time is very
limited.

As a prepubescent child, I played a shareware game where
balloons would rise on the screen. You'd use your mouse to draw a
bowstring, flying an arrow horizontally through the balloon field,
timing the ascent of a balloon. It's this game that immediately came to
mind when I tried to think of simple games. The satisfaction of that
balloon popping noise made me long to play. (A satisfaction only
outpaced by the sound of popping bubble-wrap.) 

So, I decided to work on
a game like that other game, and started on making balloons float up. I
went to [http://openclipart.org](http://openclipart.org) and found a
great balloon-popping sound at
[http://soundbible.com](http://soundbible.com). I started out by using
CCActions, a CCSequence composed of CCMoveUp and CCCallFuncND to perform
cleanup. The balloons would randomly spawn at a certain interval below
the screen, and rise to a height above the screen, out of the viewport,
and be removed from the layer.

![]({{ site.baseurl}}/assets/balloon-burst-old-treasures-02-300x153.png "balloon-burst-old-treasures-02")

Somewhere along the line, I decided that an bow and arrow would be
unnecessary, and that touching a balloon would be enough to pop it. At
the same time, I'd target the game at children. I implemented procedures
to detect a balloon touch, show a particle effect upon touch, play the
popping noise, and remove the balloon from the layer immediately.

Play-testing confirmed this mechanic was a little boring in of itself. I
figured that popping balloons should release things stored inside, so
you should be able to earn points for popping balloons and touching a
"treasure item" dropped from the balloon, things like: diamonds, coins,
and treasure boxes. I also added clouds in the background, a timer, and
score display, the concept of rounds, and a game over state.

![]({{ site.baseurl}}/assets/balloon-burst-old-treasures-01-300x153.png)

I got this working, but it didn't seem especially targeted towards
children. Lisa, my wife, tried it and confirmed as much. We talked about
marking each balloon with a letter, and using the balloons to spell
words or elsewise learn about words.

After thinking for a bit, I decided
that balloons marked with a letter would release a word starting with
that letter. When you touched the word dropped by a balloon, that word
would be spoken aloud. I downloaded
[Audacity](http://audacity.sourceforge.net/), and had Lisa recite a list
of words. I spliced them and loaded them into my project Resources
folder. Once I got the code working, so that the word sound would play
when the word was touched, the audio seemed to low, like it had not been
normalized. Even after reducing the volume of the background music and
popping sound, the words weren't loud enough. We'll have to redo the
word sounds at some point.

![]({{ site.baseurl}}/assets/balloon-burst-ipad-play-01-300x233.png)

At this point, I'm mostly done, but may add some more graphics and clean
up the code. This project has been a great introduction to Cocos2D and
Objective-C programming, in general.

Check out game footage below and
the complete source code, including assets, on Github:
[http://github.com/jamiely/ios-balloon-burst](http://github.com/jamiely/ios-balloon-burst)

<iframe width="420" height="315" src="https://www.youtube.com/embed/W6FI7X5PjN8" frameborder="0" allowfullscreen></iframe>
