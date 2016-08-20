---
layout: post
status: publish
published: true
title: Connect Four in Rust
author: Jamie
date: 2016-08-20
categories:
- Software
tags:
- rust
- gamedev
- connect-four
---


I have this thing where I learn a new language by implementing a
command-line Connect Four game.
[The last time I did this I used Go.](/programming/2013/10/02/connect-four-go.html)
The nice thing about this is that I have a full test suite that I can
just translate into the target language, and begin the implement to
game using [test-driven development
(TDD)](https://en.wikipedia.org/wiki/Test-driven_development).

[Rust](https://www.rust-lang.org/en-US/)
has interested me for awhile because of it's lack of a garbage
collector and functional programming aspects. I'm not so interested in
the performance improvements you get when you don't have GC. What's more
interesting to me is how the language approaches memory management. I've
worked in other languages like C where it is loosely convention based,
Objective-C without [Automatic Reference Counting
(ARC)](https://en.wikipedia.org/wiki/Automatic_Reference_Counting) where
it is more strictly convention based, and Objective-C with ARC where it
is managed by the compiler without a separate garbage collector.
Objective-C with ARC seemed to work well although it's not hard to wind
up accessing a released weak reference or with a [retain
cycle](https://digitalleaves.com/blog/2015/05/demystifying-retain-cycles-in-arc/)
(especially when working with closures).

Some of the functional programming features Rust includes are closures,
immutability, pattern matching, and standard library iterators which you
can fold over.  [The Rust Programming Language
book](https://doc.rust-lang.org/book/) was my primary learning resource,
and it is _excellent_.

If you want to follow along, the code for
[Connect Four Rust is on Github](https://github.com/jamiely/connect-four-rust).
I started with a simple test that the board has the expected number of
rows and columns.

```rust
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn should_have_7_columns_and_6_rows() {
        let board = Board::new();
        assert!(board.rows == 6);
        assert!(board.columns == 7)
    }
}
```

This is really easy to make pass, and introduced me to structs and
_traits_, which functionally seem more similar to Golang's _methods on
structs_ rather than _Scala traits_.

```rust
pub struct Board {
  pub rows: usize,
  pub columns: usize,
  markers: HashMap<Index, Marker>
}

impl Board {
  pub fn new() -> Board {
    let rows = 6;
    let columns = 7;
    // markers initialization elided
    Board {
      rows: rows,
      columns: columns,
      markers: markers
    }
  }
}
```

Once a `Cargo.toml` is defined, we can run the test using `cargo test`.

Next, I added the following test for a method that returns all the board
indices as tuples `type Index = (usize, usize)`.

```rust
#[test]
fn it_should_have_rows_times_columns_indicies() {
    let board = Board::new();
    let indices = board.indices();
    assert!(indices.len() ==
      board.rows * board.columns);
}
```

Implementing this, we get to use some methods on iterator which take
functions. There are a couple cool things going on here. First, there is
a concise range syntax--a feature I love in languages like Swift and
Scala. We can map over the range of 0 until the number of rows to create
a tuple of `(column, row)`. Rust has first-class support for tuples like
in Python and Haskell. When we map over the rows, we can pass a closure
to create the tuple. Finally, we call `collect` to consume the iterator
into a `Vec` collection.

```rust
impl Board {
  // ...
  pub fn indicies_from_rows_and_columns(rows: usize, columns: usize) -> Vec<Index> {
    (0..columns).flat_map(|column: usize| {
      (0..rows).map(move |row: usize|
        (column, row))
    }).collect::<Vec<Index>>()
  }

  pub fn indicies(&self) -> Vec<Index> {
    Board::indicies_from_rows_and_columns(
      self.rows, self.columns)
  }
}
```

The next test added checks for board emptiness.

```rust
#[test]
fn it_should_be_empty() {
  let board = Board::new();
  assert!(board.is_empty());
}
```

To implement this, we create a method which checks that all the board
markers are zero.

```rust
pub fn is_empty(&self) -> bool {
  self.markers.values().all(|v|
    Marker::Empty.eq(v))
}
```
`markers` is a map whose keys are index tuples and whose values are
`Marker` values as defined below. Another aspect of Rust that reminds me
of Haskell is that certain traits can be automatically derived.

```rust
#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Marker {
  Empty, X, O,
}
```

The next test implements a getter and setter for marker indexes. The
implementation is pretty straight forward except for `clone`s in both
methods in order to transfer ownership. In the case of `set_marker`, we
want the `markers` map to own indexes since they will be used as keys.
In the case of `get_marker` I don't think the clone is necessary, as the
caller should just be able to dereference an `Option<&Marker>`, but that
is the code I wound up with.

```rust
pub fn set_marker(&mut self, index: &Index, marker: Marker) -> () {
  self.markers.insert(index.clone(), marker);
}

pub fn get_marker(&self, index: &Index) -> Option<Marker> {
  self.markers.get(&index).map(|r| r.clone())
}
```

Implementation continued in a mostly trivial way, but one thing that
confused me was calling `to_owned` on literals. Below, I implement the
`Display` trait for `Board`, which will show something that looks like
this:

```
_______
_______
__X____
__X____
_XYY___
_XYXY__
```

In order to use the `join` method on `Vec<String>`, I need to return a
`String` reference from the map. If I return just a `"_"`, I would be
returning a `&String` instead. Having tried a few other things, this is
the best I've wound up. I do think that perhaps I could instead `write!`
on each iteration and then `fold` the resulting `fmt::Result` values
into a single value which is returned.

```rust
impl fmt::Display for Board {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    let result: String =
    (0..self.rows).rev().map(|row: usize| {
      (0..self.columns).map(move |column: usize| {
        match self.get_marker(&(column, row)) {
          Some(marker) => format!("{}", marker),
          None => "_".to_owned(),
        }.to_owned()
      }).collect::<Vec<String>>().join("").to_owned()
    }).collect::<Vec<String>>().join("\n");
    write!(f, "{}", result)
  }
}
```

It was a fun exercise, as it usually is. If you're interested in other
implementations, try this [Connect Four
repository](https://github.com/jamiely/connect-four) which collects all
of the other projects using git submodules.

