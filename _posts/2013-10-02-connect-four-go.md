---
layout: post
title: Connect Four in Go
date:   2013-10-02 07:00:00
categories: programming
tags:
  - programming practice
  - connect four
  - golang
comments: false
---

# Introduction

When learning a new programming language, I learn best by mapping the
languages's contructs to what I already know. This helps to get past the
initial stumbling blocks of syntax, allowing me continue further study
into topics such as tooling, language philosophy, and writing idiomatic
code.

My goto project is Connect Four. I have already worked on versions in
[three](http://jamie.ly/wordpress/programming/software/connect-four-in-coffeescript-and-scala/)
[other](http://jamie.ly/wordpress/programming/software/connect-four-in-coffeescript-using-three-js/)
[languages](http://jamie.ly/wordpress/programming/connect-four-objective-c-implementation/). 
It has simple gameplay and provides
avenues for further direct work in testing, UI and graphics, and
AI. 

Having been interested in Go for awhile and gone through the tour
already, I decided to take it for a spin by implementing [another Connect
Four version in Go](https://github.com/jamiely/connect-four-go).

# Thoughts

Starting to work with Go, one of the best things that I immediately
noticed was that the tooling felt very integrated. Most of the commands
you need are subcommands under the `go` command. Importing external
libraries is incredibly easy by specifying a code repository path. In
addition, some of the more common code hosting sites including Github
are directly supported.

# Namespacing Issues

One of the trickier things was figuring out how namespacing worked. I
had difficulty with testing due to namespacing, and ultimately decided
to lump everything into the same namespace. 

# Conclusion

This exercise was very informative in scratching Go's surface. My next
area of exploration is to implement either a simple AI using goroutines
and channels. 

