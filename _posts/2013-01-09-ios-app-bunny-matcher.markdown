---
layout: post
status: publish
published: true
title: 'iOS App: Bunny Matcher'
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4625
wordpress_url: http://jamie.ly/wordpress/?p=4625
date: 2013-01-09 07:00:13.000000000 -05:00
categories:
- Software
tags:
- computer graphics
- vector
- ruby
- game programming
- iOS
- objective-c
- Frank
- ocunit
- game development
- bxfr
- Inkscape
- ImageMagick
comments: []
---
<h2>Introduction</h2>
I recently finished a game for iOS called Bunny Matcher. This will probably be my last iOS app for awhile, as I want to do more Android development. I&rsquo;m also ramping up with my new job doing iOS development, so I get plenty of practice with Objective-C every day.

Bunny Matcher has the same concept as the classic game <a href="http://www.youtube.com/watch?v=9RtRykIE_1A">Super Munchers</a>. You control a bunny which must match words on a grid to a presented topic. For example, if the topic is Planets, you may have to select words like Mars, Earth, and Venus. Conflict comes in the form of non-topic words, which penalize the player by hurting his score, and a fox that moves across the board. The player must avoid the fox, as touching the fox costs 1 of 3 total lives.

<a href="http://jamie.ly/wordpress/wp-content/uploads/2013/01/iOS-Simulator-Screen-shot-Dec-31-2012-11.54.42-PM.png"><img class="aligncenter size-medium wp-image-4630" title="iOS Simulator Screen shot Dec 31, 2012 11.54.42 PM" alt="" src="http://jamie.ly/wordpress/wp-content/uploads/2013/01/iOS-Simulator-Screen-shot-Dec-31-2012-11.54.42-PM-300x225.png" width="300" height="225" /></a>

I spent between 25 and 40 hours on the game (I really should start to measure the time more accurately). With 5 to 10 hours spent on the graphics, which might be surprising since they are so basic. It&rsquo;s tough to get more accurate with the time, because, as a working father, I have to squeeze in project time here and there. The graphics were done in Inkscape, which I haven&rsquo;t used in a while for anything substantial, so part of the time was the learning curve there. I&rsquo;m most proficient with Illustrator.

<a href="http://jamie.ly/wordpress/wp-content/uploads/2013/01/bunny_sprites.png"><img class="aligncenter size-medium wp-image-4634" title="bunny_sprites" alt="" src="http://jamie.ly/wordpress/wp-content/uploads/2013/01/bunny_sprites-300x72.png" width="300" height="72" /></a>
<h2>Project walkthrough</h2>
What follows is a brief description of the process of writing this app. I am looking through the commit log to refresh my memory.

```bash
git log --reverse --name-only
```

The first few commits involved setting up the project. I decided to target iOS 6 to simplify things and so I could use the built-in UICollectionView and try auto layout. This would come to aggravate me later. I created some simple placeholders like custom table cells that would display the words. The UIViewController for the board was the first one I worked on. I like to work on the primary functionality first.

The next major phase of the project was the creation of model classes to represent the various information that I would display. I worked on making things very modular and testable, and there are several OCUnit tests for the models. I also focused on implementing a simple and readable API that made the flow of game creation, round rollover, and word and topic drawing straightforward.

Next, I worked on implementing a HeroView and movement of this view within the BoardViewController&rsquo;s view. Upon clicking a collection view cell, the hero needed to animate to the location of that cell and center on it. Since I was focusing on playability, I used a UIView with a colored background containing a UILabel with text &ldquo;Hero&rdquo; to represent the hero. I knew that eventually, I would have some animation playing in this view, but it was more important to focus on the playability of the game.

The next set of modifications deal with refinement to support &ldquo;eating&rdquo; board spots. This includes new model classes as well as changes to touch detection. There was also refactoring happening along the way. It&rsquo;s important to refactor as you go rather than doing it all in one batch and leads to greater stability.

Scoring had been added by this point, and a TitleViewController provided a simple menu to start play. The score was the first quasi-objective available, and later I would decide there had to be a high scores list to make this a true objective. An enemy was soon added, along with a lives counter, adding additional conflict.

As movement became more complicated and the enemy and hero shared movement functions, I began to refactor movement into its own class, ActorMovement.

Round completion was the next major enhancement. Once the player had matched all the words with the presented topic, the next round would start, with a new topic. This would continue until the player lost by losing all her lives or running out of time.

At this point, I went on <a href="http://opengameart.org">http://opengameart.org</a> and found a few suitable sprite sheets to use in animating the hero and enemy. Specifically, I used <a href="http://opengameart.org/content/kit-the-firefox-mascot">this fox animation</a> and <a href="http://opengameart.org/content/tux-the-linux-mascot">a Tux animation</a> by the same artist. These would serve as placeholders until the very end of the project, when I worked on my own sprites. Further work was also done on refining the flow from frame to frame.

One of the big comments I got from playtesting is that the original topics I seeded the game with were too difficult. They included gemstones, obscure dinosaurs, and types of fish. I simplified them later to make the game much more simple, as it is intended for kids anyway.

It&rsquo;s funny how much sound can improve a game. I implemented a simple sound manager to play sound effects I generated using the <a href="http://www.bfxr.net/">Bxfr tool</a>. It&rsquo;s really simple to make old-school sound effects. Although I think the game could further benefit from some sort of background music, I submitted the first version without it.

The remaining commits added further polish including work on view controller flow, UI modifications, and the addition of graphics.

Speaking of UI modifications, I found at several points throughout the project that adding new subviews to the Board view would cause unexpected effects with regards to auto layout, causing hero and enemy animations to go haywire. The hero would start to move somewhere, and then get teleported back to its original position. It took me awhile to figure out this was due to constraints. Although I tried to programmatically remove constraints on the animated views, this didn&rsquo;t seem to rectify the problem. I concede that I did not investigate the solution much, and might&rsquo;ve been doing something wrong. The solution I wound up applying was to modify constraint priorities until the views could animate freely.
<h2>Animation</h2>
I used Inkscape to draw the graphics. I&rsquo;m much more experienced with Illustrator, so I found working with it very clunky. <a href="https://bugs.launchpad.net/inkscape/+bug/307005">I also ran into a nasty bug that I thought was a feature, that caused pasted objects to be inserted as bitmaps</a>. Once I learned a few of the more common shortcuts, working with Inkscape wasn&rsquo;t so bad.

I didn&rsquo;t want to spend a lot of time on the graphics, since it is outside of the purpose of creating the application, so you&rsquo;ll find the graphics fairly basic. I&rsquo;ll briefly discuss the process of creating the animations for the uninitiated.

I worked on the bunny animation first. I looked for reference images of rabbits on Google, specifically of one at rest. I created the rough shape of a rabbit using graphical primitives such as ellipses. The following image shows the individual shapes used for the rabbit.

The most important thing was to try to group the primitives by movement areas. For example, to create shapes for the legs that could be rotated to show movement. The following image shows grouped body parts.

The Clone feature is a great way to make sure that similar shapes like those used for the legs or arms stay synchronized. By grouping body parts by movement areas, creating subsequent images based on this one is simple. For the running images, I created two new images based on this one, and rotated the body parts appropriately. I repeated this process for the fox. These images are available for use in the <a href="https://github.com/jamiely/bunny-matcher">GitHub repository</a>. They are also available from <a href="http://opengameart.org/users/jamiely">my opengameart profile page</a>.

Once I created the svg&rsquo;s in Inkscape, I exported the images as png&rsquo;s and used ImageMagick to stitch them together. ImageMagick provides an adjoin command that makes creating sprite sheets simple.

```bash
convert -adjoin \
  bunny_standing.png bunny_run_1.png \
  bunny_run_2.png bunny_sprites.png
```

ImageMagick provides a handy command for this as well.

```bash
convert -delay 25 \
  -dispose Previous bunny_run_1.png \
  -delay 25 \
  -dispose Previous bunny_run_2.png \
  -loop 0 bunny_run.gif
```

<h2>Tools</h2>
I used various tools to complete the project. I&rsquo;ve already mentioned Inkscape and ImageMagick. I also started using the <a href="https://github.com/JugglerShu/XVim">XVim plugin</a> with this project, and I&rsquo;ve since started to use it at work as well.

I implemented a rake task to bump the version number. Some bash scripts provide simple building and distributing tasks. The <a href="https://github.com/mattt/shenzhen">shenzhen gem</a> is what I use for building and distributing test builds via TestFlight.

I used QuickTime for my screencasts and Bxfr for the sound effects.
<h2>Conclusion</h2>
This was a fairly entertaining project to work on, as the concept was clear in my mind. I spent a lot of time focusing on clarity of code and refactoring as I went along. One thing that I could&rsquo;ve done better was work on adding integration tests as I went along. Although I&rsquo;ve used <a href="http://testingwithfrank.com">Frank</a> for integration testing before, I didn&rsquo;t think it would be very useful in this case. I&rsquo;ve been finding Frank clunky for testing the more I use it. This application may be a good opportunity to investigate the other integration testing frameworks I&rsquo;ve been interested in, namely UIAutomation and <a href="https://github.com/square/KIF">KIF</a>.

I also enjoyed working on the animation and would like to spend time on my next project playing with Blender for the graphics.

If you are interested in the project, <a href="https://github.com/jamiely/bunny-matcher">the source is on GitHub</a> and here&rsquo;s <a href="https://itunes.apple.com/us/app/bunny-matcher/id590498392?ls=1&amp;mt=8">a link to the Bunny Matcher in the App Store</a>.
