---
layout: post
title: Poker Match, A Game Using Phaser
date:   2015-04-11 07:00:00
categories: programming
tags:
  - javascript
  - game development
  - phaser
---

![Poker Match Logo]({{ site.baseurl}}/assets/2015-04-11-poker-match-logo.png)

# Intro

It's been too long since I posted a new entry in this blog. Since I'm
not working on anything in particular at the moment, at least in my
personal time, I thought I'd comment on the game I wrote in January
using the [Phaser game framework](https://phaser.io/).

When the year started, I had a small hope of participating in
[#1gam](http://www.onegameamonth.com). The result has played out as I
expected, and I haven't really been up to the task of completing the
challenge.  Still, I did put out one game this year that is playable,
and for that I am thankful. The game is called [Poker
Match](http://blog.jamie.ly/poker-match/), a drag-to-match puzzle game
where the matches are Poker hands.

I've implemented games like this before, such as Bubble Breaker
([Demo][1] | [Source][2]), Tetris ([Demo][3] | [Source][4]), and Tetris
Attack ([Demo][6] | [Source][7]). Poker Match is the first game like
this that I've done that is not a direct clone (although
I wouldn't be suprised if this kind of game does exist). One of the more
interesting parts of the project was the change in the way matches are
created. In [version 1][7], matches were created by swapping the
position of two cards, in the same way you can swap two blocks in Tetris
Attack. This just didn't feel right. After some thought and play
testing, I changed the mechanics to create matches by dragging along the
cards.
[Puzzlecraft](https://itunes.apple.com/us/app/puzzle-craft/id489178757?mt=8)
is an example of a game that uses this method. 

![Poker Match Screenshot]({{ site.baseurl}}/assets/2015-04-11-poker-match-screenshot.png)

# Implementation Notes

This was a straightforward implementation. Most of the technical
difficulties arose in making sure matching was working correctly. For
these, [the specs][8] helped to make debugging easier. Even though I am
not using [AngularJS](https://angularjs.org/), I used
[Karma](http://karma-runner.github.io/0.12/index.html) as the test
runner with [Jasmine BDD](http://jasmine.github.io/) for the unit tests.

I kept the modules separate, and concatenated them together for
development and building. If I had it to do over again, I would've used
NPM module syntax and used [browserify](http://browserify.org/) to
combine them. 

Aside from the game matching logic, just learning Phaser took up the
majority of the time. Although it was straightforward, there were just a
few things that gave me pause when considering how to implement them.
For example, I wanted to create a card-flip animation, that used
negative scaling across the x-axis. It was a little tricky getting the
timing working so that it looked correct due to weirdness with the
anchoring and the fact that a card is made up of two sprites--one for
the back and one for the front. I had to make sure that the two sprite
were eased together during the animation in a realistic-looking way.

Another tricky thing was figuring out a simple way to create the
buttons. Since I wanted to use `text` objects instead of images for the
button text, I used `group`s to combine the objects. This resulted in
some weirdness when it came to anchoring and placement. I could've been
doing something wrong, but, if not, it's funny how the simplest things
can be so time consuming.

The last aspect which took up a good chunk of time was getting the
animations working correctly. There are several animations involved when
completing a level, including making sure that the matched cards are
removed from the board, lowering a curtain, and then animating the score
board with a staggered reveal and counter effect. Although not
technically challenging, this part required many iterations to get it
looking decent. 

<video controls>
  <source src="{{ site.baseurl}}/assets/2015-04-11-poker-match-v2.2.0-curtain-drop.mp4" type="video/mp4">
  <source src="{{ site.baseurl}}/assets/2015-04-11-poker-match-v2.2.0-curtain-drop.ogg" type="video/ogg">
  <source src="{{ site.baseurl}}/assets/2015-04-11-poker-match-v2.2.0-curtain-drop.webm" type="video/webm">
  Your browser does not support the <code>video</code> element.
</video>


## Matching

At first, since the game mechanic involved swapping blocks, the matching
algorithm was something like the following:

1. For each card that was moved (referred to as the anchor card):
2. For each match type (such as kinds, straights, and flushes), and
   each cardinal direction, create a match object. This object will be
   used to build and track matches by the anchor card, match type, and
   direction.
3. For each match object, move in the direction specified. If adding the
   card in that direction would yield a valid match, the card is added,
   and the next card is examined.
4. The matches along the same axes are merged. For example, if
   there is a match of the same match type to the left of the anchor and
   to the right of the anchor, then those matches may be merged into a
   single match.
5. Finally, some filtering is done to remove matches of insufficient
   size.

Despite spending the time to get this algorithm working correctly, when
matching was changed to be based on dragging, it became much easier to
determine whether something was a match. While this algorithm still
worked, I would've instead been able to use the following algorithm.

1. Starting with the first card in the chain
2. For each match type, determine if the next card in the chain would
   meet the requirements for the match type. Repeat until the end of the
   chain is reached.
3. If there are any match types which are still valid, then the chain
   makes a valid match.

This is much simpler to implement and understand.

## On using closures for matching

To genericize the process of matching, each match object has a key
called `nextPredicate` which is sort of an enumerator for predicates.
When invoked with a direction, this enumerator must return the next
predicate to use, which will match the last card against the next one.
When matching for flushes or kinds, which has a sort of trivial type of
match that is based solely on the anchor card's values, the predicate
returned is always the same. In the case of straights, whose predicates
change as we move along a card chain, we can use a closure to make
predicate matching very easy. 

```javascript
// Matcher.js 
// line 107
// An initial dictionary that we use to track our progress in matching,
// by direction.
var nextStraightValues = _.reduce(PM.Direction.All, function(mem, dir) {
    mem[dir.toString()] = original.jalCardValue.value;
    return mem;
    }, {});

// line 119
// this function will be a `nextPredicate`
function(dir) {
  // capture this value for the next iteration
  var nextValue = getNextStraightValue(nextStraightValues[dir.toString()], dir);
  nextStraightValues[dir.toString()] = nextValue;
  // returned function
  return function(a, b) {
    var result = validCardPredicate(a, b) && 
      nextValue !== null &&
      b.jalCardValue.value === nextValue;

    if(!result) {
      // invalidate this predicate
      nextStraightValues[dir.toString()] = null;
    }

    return result;
  };
}
```

Above, the `nextPredicate` for straights closes over `nextValue`, so
that the returned predicate can keep track of which cards is next, and
in which direction. That value is captured by the returned predicate
to be used when it is invoked.

## Statistics Rendering

After a level is completed, various statistics are shown to the player
including the number of different types of matches they completed, and
their total score. Not only is display of each of these staggered, the
numbers count up from 0.

This is accomplished through a simple state machine which keeps track of
which value is currently being incremented, and once that is done,
displays and increments the next value, until there are no more entries
to be shown.

Although it's implemented via a state machine and an update function, I
did debate whether I should write some sort of custom Text tween. One of
the biggest benefits of this would've been being able to use existing
animation functions including callbacks. Unfortunately, it wasn't
intuitive about how to go about this, and I figured I'd be spending more
time on the implementation than need be.

# Completion

When I started this project, I wanted to be done at the end of January,
and I was. Typically I work a couple hours a week, sometimes more on
weekends. Most of the last few projects I'd done before this were more
for learning, whether it be new frameworks or whole new languages. This
project was all about completion, and I had to make several tradeoffs.
These are things like concatenating all the source files instead of
using something like browserify or avoiding implementation of a text
tween.

[1]: http://jamie.ly/demos/bubble-breaker-canvas/
[2]: https://github.com/jamiely/bubble-breaker-canvas
[3]: http://jamie.ly/labs/tetris/
[4]: https://github.com/jamiely/tetris-flash
[5]: https://github.com/jamiely/simple-clojure-game
[6]: http://jamie.ly/labs/tetris-attack-clojurescript/index.html
[7]: https://github.com/jamiely/poker-match/releases/tag/v1.0.0
[8]: https://github.com/jamiely/poker-match/blob/v2.2.0/specs/matching.js

