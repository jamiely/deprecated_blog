---
layout: post
title: "Blackjack and Monte Carlo"
date:   2014-02-19 07:00:00
categories: programming
tags:
  - game programming
  - javascript
  - DOM
  - monte carlo
  - ai
  - probability
comments: false
---

# Intro

For a set of articles I'm working on, I wanted to illustrate the use of
[monte carlo methods](http://en.wikipedia.org/wiki/Monte_Carlo_method)
for simple game solving. To make the example digestible, I
implemented a bare-bones BlackJack game. You can try a 
[demo here](http://blog.jamie.ly/blackjackjs). Each player goes in turn,
and may either hit or stay. A hint shows at the bottom of the screen
that gives advice to the player, based on running a monte carlo
simulation of the game at that point. 

<iframe width="420" height="315" src="//www.youtube.com/embed/zunsiNbfGwE" frameborder="0" allowfullscreen></iframe>

# Example

Let's say there are two players. You and the dealer. You're showing a 10
and 5, and the dealer shows a 6 with a face-down card. What should you
do? The probability can be calculated assuming a fresh shoe of 5 decks,
but is tedious.

If we wanted to determine the probability using a monte carlo
simulation, assuming a fresh shoe, we can take the following
steps. 

## Part A

1. Remove the cards we know about: 10, 5, 6.
2. Now, for each of our possible moves, stay and hit in this case,
   repeat part B _many_ times, recording wins.
3. Evaluate how good the wins are using the accumulated statistics. 

## Part B

1. Shuffle the cards in the shoe.
2. Discard a number of cards equal to the number of unknown cards (just
   1 in this case, the dealer's unknown card)
3. Make the move chosen in Part A.
4. Play out the rest of the game randomly.

The more times you repeat part B, the closer the statistics should
approach the real probabilities of winning given each move. 

# Why?

I mentioned that this is straightforward to calculate directly, so why
don't we do that? There are a couple reasons:

1. Sometimes you can't assume a fresh shoe. Monte carlo methods can be
   more flexible in determining probability in a wider variety of
   scenarios.
2. There are games more complicated than BlackJack, and those are harder
   to calculate probabilities for. This could be because the space of
   possible moves is much larger or because there are many more win
   conditions.
3. Using monte carlo is fairly straightforward and timely (at least
   compared to searching game trees).

# Possible Enhancements

Since the point of the article I'm writing is monte carlo simulation, I
implemented the bare minimum of what I needed to do that. The full
source is available at 
[blackjackjs on GitHub](https://github.com/jamiely/blackjackjs). Here
are some possible things you or I might work on in the future:

* The ability to play multiple hands
* Using web workers to run the simulation. This would allow many more
  trials to happen. (Alternatively, we could rewrite the simulation
  fairly simply to use thunks instead of doing things synchronously.)
* The ability to set simulation settings such as number of players,
  current hands, and number of trials.
* Add the ability to split a hand.

# Probability

Since I said it was straightforward, I should probably dredge up what
little I remember and try to calculate the probability of winning the above
hand. 

Recall we have 10 + 5 = 15. We can hit or stay at this point. Let's take each
case separately. Let's also work with a single deck so that the math is
just a tad easier.

Let's calculate the probability of winning if we stay (since that is
easier). If we stay, the dealer must bust for us to win, because the
dealer must hit until 17. What are all of the possible ways for him to
bust? Firstly, the dealer cannot have an ace, or he will have 17 and
we'll have lost. He must hit and have a value of at least 16 combined
with the unknown card (which again, cannot be an ace). What are all of
the combinations of cards that add to at least 16?

Only a card greater than 5 will do. Starting with 6, any face card will
do the job. So, we can pair a 6 with a 10, J, Q, and K. Since the dealer
has a 6, there are only 3 other 6s. We have a 10, so there are 3 other
10s. There are 4 each of the other face cards. Remember that 3 cards
have been revealed, meaning there are 49 possible cards left.  So, the
probability of having a 6 is 3/49, and the probability of having a card
with value 10 is (3 + 4 + 4 + 4)/49 = 15/49. We multiply the
probabilities together since the events of drawing are independent. That
comes to a probability of 1.7% that we will win if we stay, if the
dealer busts with some combination of two 6s and a face card.

If any of this math seems off, let me know! This is tedious, but you can
see we could write a program to finish this calculation. The only other
wrinkle is that we need to make sure we don't double-count events.


