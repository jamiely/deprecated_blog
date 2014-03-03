---
layout: post
status: publish
published: true
title: Tabbed list to HTML in CoffeeScript
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
wordpress_id: 4766
wordpress_url: http://jamie.ly/wordpress/?p=4766
date: 2013-04-29 07:00:37.000000000 -04:00
categories:
- Programming
tags:
- parser
- coffeescript
comments: []
---
A friend asked for a script to converted a tabbed list of data to a nested HTML list. Here it is:&nbsp;http://codepen.io/jamiely/pen/AbEjd. Before working on this, I didn't know CodePen had live CoffeeScript editing. That feature moves it into the favorite spot above jsfiddle for live code editing.

Given a sample of text like this:

```
Dog
  Puppy 1
  Puppy 2
    Page 1
    Page 2
  Puppy 3
    Page 1
    Page 2
    Page 3
    Page 4
  Puppy 4
Cat
  Kitty 1
  Kitty 2
    Page 1
      Paragraph 1
      Paragraph 2
    Page 2
  Kitty 3
Turtle
Horse
  Pony 1
  Pony 2
  Pony 3
```

Convert it to an equivalent HTML list like this:

```html
<ul>
  <li>Dog</li>
  <ul>
    <li> Puppy 1</li>
    <li> Puppy 2</li>
    <ul>
      <li> Page 1</li>
      <li> Page 2</li>
    </ul>
    <li> Puppy 3</li>
    <ul>
      <li> Page 1</li>
      <li> Page 2</li>
      <li> Page 3</li>
      <li> Page 4</li>
    </ul>
    <li> Puppy 4</li>
  </ul>
  <li>Cat</li>
  <ul>
    <li> Kitty 1</li>
    <li> Kitty 2</li>
    <ul>
      <li> Page 1</li>
      <ul>
        <li> Paragraph 1</li>
        <li> Paragraph 2</li>
      </ul>
      <li> Page 2</li>
    </ul>
    <li> Kitty 3</li>
  </ul>
  <li>Turtle</li>
  <li>Horse</li>
  <ul>
    <li> Pony 1</li>
    <li> Pony 2</li>
    <li> Pony 3</li>
  </ul>
</ul>
```

And here's the relevant bit of CoffeeScript to do it:

```coffeescript
# Call `convert`!
# Converts tabbed-text to HTML
convert = (text) ->
  parse text.split '\n'
 
# Creates a list item element from a piece of text
li = (t) ->
  html = "<li>#{t['line']}</li>"
  ptAccum.push html
  html
 
# Creates a start UL tag
ul = (t) ->
  ptAccum.push "<ul>#{li(t)}"
 
# Creates an ending UL tag
ulEnd = ->
  ptAccum.push "</ul>"
 
# Will be used to store the generated HTML
ptAccum = []
# Will be used to track progress
index = 0
 
# Begins the parsing procedure
parse = (lines) ->
  ts = linesToMaps lines
  ptAccum = ["<ul>"]
  index = 0
  parseTuples ts, 0
  ulEnd()
  ptAccum.join "\n"
 
# Does the bulk of the parsing job, keeping track of the indentation level
parseTuples = (tuples, level) ->
  stop = false
  _p = ->
    t = tuples[index]
    curLevel = t['level']
    index++
    if curLevel == level
      # sibling, process the current at the same level
      li(t)
    else if curLevel < level
      # we want to unindent
      # dont do anything here
      index--
      stop = true
    else
      # we are at the first child
      ul(t)
      parseTuples tuples, level + 1
      ulEnd()
 
  _p() while !stop && index < tuples.length
 
# Returns the number of tabs that prefix a line
tabCount = (line) ->
  tc = 0
  c = '\t'
  count = 0
  count = line.length if line
  i = 0
 
  isTab = ->
    c == '\t'
 
  inc = ->
    c = line.charAt(i)
    tc++ if isTab()
    i++
 
  inc() while isTab() && i < count
 
  tc
 
# Converts the passed line to a map containing the line and meta-data about the line
lineToMap = (line) ->
  line: line
  level: tabCount line
 
# Returns true if the string is blank
blank = (line) ->
  !line || line.length == 0 || line.match /^ *$/
 
# Converts the passed lines into maps rperesenting the line
linesToMaps = (lines) ->
  lineToMap line for line in lines when !(blank line)
```

