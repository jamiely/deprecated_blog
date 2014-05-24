---
layout: post
status: publish
published: true
title: ClojureScript - Tetris Attack
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4724
wordpress_url: http://jamie.ly/wordpress/?p=4724
date: 2013-02-18 07:06:38.000000000 -05:00
categories:
- Software
tags:
- javascript
- game programming
- canvas
- clojure
- game development
- clojurescript
- tetris attack
- leiningen
- functional programming
comments: []
---
Intro
=====

Having completed a [simple implementation of the game Breakout in
Clojure](/wordpress/programming/software/clojure-breakout/), I decided
my next Clojure project should be doing something with
[ClojureScript](https://github.com/clojure/clojurescript). Not only
would it provide an opportunity to continue Clojure practice, but I'd be
able to leverage existing knowledge I have about JavaScript (probably
the language I am most familiar with), and I could possibly use it in
the future for a web project. Note that I've only tested this with the
most recent version of Chrome. Performance is not great right now, but
can be much improved. [Here's a
demo](http://jamie.ly/labs/tetris-attack-clojurescript/index.html).

Clojure v ClojureScript
=======================

I found the process of building projects, sharing code between Clojure
and Clojurescript, and building the source to be very straightforward. I
used [cljsbuild](https://github.com/emezeske/lein-cljsbuild) to
accomplish many of these needs. Especially useful was the `repl` which
can be used to communicate with ClojureScript code running in the
browser. There were two sources of headaches I had with working with
ClojureScript, as compared to Clojure.

1.  I had to create compatability namespaces to wrap thigngs that are
    available in `clojure.core` but not `cljs.core`
2.  I found a couple things (hex-string support) that were supported in
    clojure.core and not cljs.core, but were not documented.
3.  When cross-compiling Clojure code for use in ClojureScript, I did
    not see in the documentation how to make namespace functions
    exportable. Admittedly, I might find my answer easily if I were to
    ask on the mailing list. This means I haven't gotten advanced
    compiling working yet, and the compiled script file is large at 1MB.

The Game
========

I decided to work on a clone of the game [Tetris
Attack](http://en.wikipedia.org/wiki/Tetris_Attack), which has provided
me with hundreds of hours of entertainment. The object of the game is to
match 3 or more blocks. The complexity of the game comes in setting off
chain reactions of matches.

Methodology
===========

The game is represented as a simple HashMap of keys and properties, that
looks something like the following: 

```clojure
{:grid {:blocks [{:type :#FF0000 :position [1 1]}
                 {:type :falling :block {...} :falling-to [3 3] :ticks 15}
                 {:type :swap :blocks [...] :ticks 10}
                 ...]
        :rows 10
        :cols 6
       }
 :clock 10}
```

Blocks are determined by type. The
simplest blocks store their color as their type. Other types have
specific meanings. For example, a "falling" block is one which is
falling down a grid column (as if pulled by gravity). Some of these
blocks have a property called `:ticks`, which determines the clock ticks
left for the action to complete. For example, a falling block with 10
ticks left, will take 10 clock ticks to finish falling, at which point
it may be resolved into a normal block. In this way, the entire
game-state is stored, and separate interface functions can work to alter
the game state. In terms of mutability, a single atom in the
`entrypoint` namespace stores the entire game state and interface state.
The rendering code is entirely separate and may operate on arbitrary
game states.

Rendering
---------

The rendering code is in the `display` namespace in a
ClojureScript-specific file that performs drawing on an HTML canvas
object. This namespace, along with the `entrypoint` namespace provide
the specific code necessary to drive the web interface. Although ideally
there'd be a namespace that contains only functions requiring
implementation to support different platforms, display and entrypoint
are not at that point. Still, implementing a version with an interface
using [three.js](https://github.com/mrdoob/three.js/) or using Java
Swing should be fairly trivial.

Learning
========

Most of the projects I do are for learning rather than anything
practical. Here are some of the main things I've learned about working
on this project:

-   Some new Clojure techniques, such as using `partial` and `into`, the
    threading operator, testing with `clojure.test`, and some more about
    how namespacing works.
-   How to work with ClojureScript - This involves syntax, building,
    debugging, crossovers, interop, and testing.
-   How to implement a game almost entirely using immutable structures.

Media
=====

You can find updated links to media as well as the full source in the
[project README](https://github.com/jamiely/simple-clojure-game). Here
are (current as of the post date) screenshots and screencasts. [Here's a
demo of the
project.](http://jamie.ly/labs/tetris-attack-clojurescript/index.html) Please
note that the script file is fairly hefty at (1 MB) since I haven't
gotten advanced compiling working yet.

[![8c8eb47](http://jamie.ly/wordpress/wp-content/uploads/2013/02/8c8eb47-300x191.png)](http://jamie.ly/wordpress/wp-content/uploads/2013/02/8c8eb47.png) 

[![0b1d1da-gameover](http://jamie.ly/wordpress/wp-content/uploads/2013/02/0b1d1da-gameover-192x300.png)](http://jamie.ly/wordpress/wp-content/uploads/2013/02/0b1d1da-gameover.png) 

<iframe width="420" height="315" src="//www.youtube.com/embed/WWK8RFEY04I" frameborder="0" allowfullscreen></iframe>
