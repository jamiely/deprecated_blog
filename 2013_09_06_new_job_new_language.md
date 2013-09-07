# A New Job, a New Language

I started a new job a couple weeks ago. As part of my duties I'll be
writing [Scala](). 

I've only had a little bit of experience with Scala in the past, having
completed a simple [Connect Four]() implementation. Although basic, the
experience gave me an opportunity to become accustomed to some of
Scala's unique syntax, as well as its preferred build tool, [sbt]().

Learning a new language is always fun for me, especially those that
introduce me to new ideas about programming, and especially interesting
language features. 

There are several language features that I've found both interesting and
mystifying that I'll describe below.

# `obj()` is `obj.apply()`

There's syntactic sugar that converts a method invocation on an object
into a invocation on its `apply` method, allowing for some nice
DSL-goodness. Take, for example, the use of pattern as part of the `Action`
DSL used in controllers in the [Scala Play
Framework](http://www.playframework.com/) (as of 2.1.3). 

```scala
class MyController extends Controller {
  def index = Action {
    Ok("success")
  }
}
```

This [is
implemented](https://github.com/playframework/playframework/blob/master/framework/src/play/src/main/scala/play/api/mvc/Action.scala?source=cc) as a singleton object `Action` which inherits an
`apply` method that returns a type of `Action[AnyContent]`. 

# Currying-syntax

The syntax to create a curried function is as follows:

```scala
def add(x: Int)(y: Int) = x + y
```

[This StackOverflow
post](http://stackoverflow.com/questions/6803211/whats-the-difference-between-multiple-parameters-lists-and-multiple-parameters)
and this [Scala langauge reference
article](http://www.scala-lang.org/old/node/135) seem to suggest the
syntax is more about having multiple parameter lists than the ability to
curry. 

In terms of partially applying a function, it is possible to do it
without using the currying syntax in the definition by using an
underscore as a placeholder variable. For an example (and a dizzying
list of the uses of underscores) see [Placeholder
syntax](http://stackoverflow.com/questions/8000903/what-are-all-the-uses-of-an-underscore-in-scala). 

# Partial Function vs Partially Applied Function

This one is embarassing. Having used a few functional languages such as
Haskell and Clojure, I was aware of the concept of currying and partial
application. When I started using Scala, and noticed type defintiions
like `PartialFunction[A, B]`, I assumed these were somehow related to
anonymous functions, specifically partially-applied functions,
especially because of Scala's syntax for creating partial functions:

```scala
{
  case x: Int if x < 10 => 1 + x
  case x: Int if x > 10 => 10
}
```

A couple of days ago, I realized that `PartialFunction`s were literally
[partial functions](http://en.wikipedia.org/wiki/Partial_function) in
that they are functions whose domain is restricted or unknown.

# Implicits

There are several types of "implicits". For example, you can have
implicit parameters which are automatically provided as arguments to
methods if none are given. See the following example:

```scala
def p(implicit s:String) = println(s)
implicit val i: String = "Hello"
p // i is automatically supplied because it is labeled implicit
// > Hello
p("Hi")
// > Hi
``` 

There are also implicit conversions or views. If we try to concatenate
an integer onto a list like so: `List(1,2,3) ++ 1` we get a `type mismatch` 
error. We can definie a view that takes an `Int` to a `List[Int]`.

```scala
implicit def intToList(x:Int): List[Int] = List(x)
```

Now, if `intToList` is in scope, the conversion will automatically be
applied:

```scala
List(1,2,3) ++ 1
// > List[Int] = List(1, 2, 3, 1)
```

# Conclusion

Learning Scala in more depth and using it with frameworks like play and
Akka have been incredibly enlightening. Being able to program
functionally daily is helping to strengthen concepts I've only been able
to use academically or for toy projects, so I'm grateful for the
opportunity!

