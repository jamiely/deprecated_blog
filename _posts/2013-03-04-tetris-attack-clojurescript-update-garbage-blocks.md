---
layout: post
status: publish
published: true
title: Tetris Attack ClojureScript Update - Garbage Blocks
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4746
wordpress_url: http://jamie.ly/wordpress/?p=4746
date: 2013-03-04 07:00:54.000000000 -05:00
categories:
- Software
tags:
- game programming
- clojure
- game development
- clojurescript
- tetris attack
comments: []
---
In this
[v1.0.3 update to Tetris Attack Clojurescript](https://github.com/jamiely/simple-clojure-game/tree/v1.0.3), 
I implemented Garbage Blocks. In Tetris Attack, Garbage Blocks are dropped onto your playing field when your opponent makes a match. The dimensions of the block depend on the nature of your opponent's match, whether it was a combo or a chain match.

For now, I've implemented randomly falling garbage blocks, which fall every 100 clock ticks. This seems somewhat fast in practice, and I'll probably dial it down at some point, especially if I ever get around to adding the concept of levels to the game.

The clear a garbage block, you must make an adjacent match. Once that happens, the garbage block splits into a set of regular blocks. Currently, the garbage block will be completely dissolved into regular blocks, which is a different behavior than the original Tetris Attack game.

There are a couple of other improvements to performance as well, but it
still runs best in Google Chrome. Below is a link to a screencast of the
current version. 
[You can also try the most current version here](//jamie.ly/labs/tetris-attack-clojurescript).

<iframe width="420" height="315" src="//www.youtube.com/embed/wasgwLAFmwY" frameborder="0" allowfullscreen></iframe>
