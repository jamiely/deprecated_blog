---
layout: post
status: publish
published: true
title: Tetris Attack ClojureScript Update - Performance Update
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4756
wordpress_url: http://jamie.ly/wordpress/?p=4756
date: 2013-04-18 08:00:33.000000000 -04:00
categories:
- Software
tags:
- clojure
- profiling
- game development
- clojurescript
- tetris attack
- functional programming
- performance
comments:
- id: 3369
  author: timgluz
  author_email: twitter.58742447@example.com
  author_url: http://twitter.com/timgluz
  date: '2013-04-18 08:37:48 -0400'
  date_gmt: '2013-04-18 13:37:48 -0400'
  content: 'RT @jamiely: Tetris Attack ClojureScript Update - Performance Update (On
    profiling) http:&#47;&#47;t.co&#47;tm7UrauW3l'
- id: 3370
  author: swannodette
  author_email: twitter.1819511@example.com
  author_url: http://twitter.com/swannodette
  date: '2013-04-18 08:28:37 -0400'
  date_gmt: '2013-04-18 13:28:37 -0400'
  content: 'RT @jamiely: Tetris Attack ClojureScript Update - Performance Update (On
    profiling) http:&#47;&#47;t.co&#47;tm7UrauW3l'
- id: 3371
  author: Sonny To
  author_email: facebook.775414304@example.com
  author_url: http://facebook.com/profile.php?id=775414304
  date: '2013-04-18 09:55:46 -0400'
  date_gmt: '2013-04-18 14:55:46 -0400'
  content: <a href="http:&#47;&#47;facebook.com&#47;profile.php?id=775414304" target="_blank">Sonny
    To<&#47;a> liked this on Facebook.
- id: 3372
  author: justinhj
  author_email: twitter.29532976@example.com
  author_url: http://twitter.com/justinhj
  date: '2013-04-18 10:15:52 -0400'
  date_gmt: '2013-04-18 15:15:52 -0400'
  content: 'RT @jamiely: Tetris Attack ClojureScript Update - Performance Update (On
    profiling) http:&#47;&#47;t.co&#47;tm7UrauW3l'
---
<h1 id="intro">Intro<&#47;h1>
<a href="&#47;wordpress&#47;tags&#47;tetris-attack&#47;" target="_blank">See my previous posts<&#47;a> about a Tetris Attack implementation in ClojureScript. <a href="https:&#47;&#47;github.com&#47;jamiely&#47;simple-clojure-game" target="_blank">The game<&#47;a> (as of tag v1.0.3) runs decently on my MacBook Air running Chrome 26. In FireFox 18, the game kind of crawls. Let's try to figure out the problem. I'll be looking at project tag v1.0.3.

Open <a href="https:&#47;&#47;developers.google.com&#47;chrome-developer-tools&#47;">Chrome DevTools<&#47;a>. Navigate to the "Profiles" tab. Refresh the app and select "Collect JavaScript CPU Profile" and click the "Start" button to begin profiling. Use the app for awhile and when you've done some representative tasks, click the red record button (or the "Stop" button) to stop profiling.

Select "Profile 1" and sort by Total %, making sure "Tree (Top Down)" is selected as the view type. I prefer to use this view so that I can drill down the call stack. It's also easier to understand when you have very functional code. For example, if I view the profile in "Heavy (Bottom Up)" mode, then <code>reduce<&#47;code> is shown as taking up a large percentage of time.

So far we use a very trivial algorithm to detect falling blocks. Profiling shows that the code that detects falling blocks is a bottle-neck and so must be improved.

Take a look at the image which shows that 70% of time is spent in the <code>resolve-grid<&#47;code> function called from <code>step<&#47;code> (our game loop function). Drilling into <code>resolve-grid<&#47;code>, we see that most of the time is spent in <code>create-falling-blocks<&#47;code>, and a function it calls <code>should-block-fall?<&#47;code>. This method starts a chain of calls that builds a list of occupied spaces each time it's invoked.

<a href="http:&#47;&#47;jamie.ly&#47;wordpress&#47;wp-content&#47;uploads&#47;2013&#47;04&#47;profiling_v1.0.3.png"><img class="aligncenter size-medium wp-image-4757" alt="profiling_v1.0.3" src="http:&#47;&#47;jamie.ly&#47;wordpress&#47;wp-content&#47;uploads&#47;2013&#47;04&#47;profiling_v1.0.3-300x175.png" width="300" height="175" &#47;><&#47;a>

Let's come up with a more efficient algorithm for detecting falling blocks.
<h1 id="falling">Falling<&#47;h1>
So what does it mean for a block to be falling? A block is falling if there is no block beneath it in the grid.

One might create a grid representing the data structure and fill this in, iterating from the bottom up. Another way to do this is to define a block falling recursively.
<h1 id="recursively">Recursively<&#47;h1>
A simple recursive algorithm for knowing if a block is falling in clojure-esque pseudocode

[code lang="clojure"]
(defn falling? [block]
  (if (in-bottom-row? block)
    false
    (if (nil? (block-below block))
      true
      (falling? (block-below block)))))
[&#47;code]
<h1 id="simplification">Simplification<&#47;h1>
This algorithm does not account for garbage blocks, which have special considerations in both falling and determining what the <code>block-below<&#47;code> is.

Another simplification is that the grid must be passed in to perform the lookups for blocks that are below the current block.

Instead of passing the grid in though, we may want to consider passing in blocks as linked-lists of columns by row. This would fit with the algorithm above. If we pass in lists of columns then we can also reduce the number of checks needed for block-below.
<h1 id="memoization">Memoization<&#47;h1>
One other improvement in performance is to memoize the falling values as we call <code>falling?<&#47;code>. There is a <code>memoize<&#47;code> function built into Clojure. The trick is that we want the function to be memoized but recursive. This is a good <a href="http:&#47;&#47;stackoverflow.com&#47;questions&#47;3906831&#47;how-do-i-generate-memoized-recursive-functions-in-clojure">StackOverflow question<&#47;a> that explains how to create a memoized recursive function. The first answer seems like what we need, but refs don't seem to be supported in clojurescript. Instead, we write our method using the style in the second answer, which requires binding the var to the namespace.

Rewriting the example above, we get something like:

[code lang="clojure"]
(def falling?
  (memoize (fn [block]
             (if (in-bottom-row? block)
               false
               (if (nil? (block-below block))
                 true
                 (falling? (block-below block)))))))
[&#47;code]

Not only is the definition of falling more clearly and elegantly stated, but the memoization should result in greater efficiency.
<h1 id="results">Results<&#47;h1>
Rewriting the <code>create-falling-blocks<&#47;code> function to use what we've talked about, yields the following results upon profiling.
<pre><code><a href="http:&#47;&#47;jamie.ly&#47;wordpress&#47;wp-content&#47;uploads&#47;2013&#47;04&#47;profiling_v1.0.4.png"><img class="aligncenter size-medium wp-image-4758" alt="profiling_v1.0.4" src="http:&#47;&#47;jamie.ly&#47;wordpress&#47;wp-content&#47;uploads&#47;2013&#47;04&#47;profiling_v1.0.4-300x161.png" width="300" height="161" &#47;><&#47;a><&#47;code><&#47;pre>
We have increased idle % from around 3% in tag v1.0.3 to around 20% in tag v1.0.4, and lowered % time in <code>create-falling-blocks<&#47;code> by around that amount.

Anecdotally, v1.0.4 seems smoother than v1.0.3 in Firefox and has better Chrome-performance as well.
