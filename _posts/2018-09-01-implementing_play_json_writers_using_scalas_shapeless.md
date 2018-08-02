---
layout: post
status: published
published: true
title: Implementing Play Json Writers using Scala's Shapeless
author: Jamie
date: 2018-09-01
categories:
- Software
tags:
- scala
- generic programming
- shapeless
- functional programming
- json
- play framework
---

Intro
=====

[shapeless](https://github.com/milessabin/shapeless)
is a library for type class and dependent type-based programming in
[Scala](https://www.scala-lang.org/). I first became interested in it
when I watched a presentation by [Dave Gurnell called The Type
Astronaut's Guide to Shapeless](https://www.youtube.com/watch?v=Zt6LjUnOcFQ).

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/Zt6LjUnOcFQ?rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

In the video, he discusses treating Scala `case class`es generically,
as lists parameterized by the type of each of its members.

Let's say you
wanted to store both a `String` and an `Int` in a list, you could use
use the most recent ancestor type as the generic type of a `List[Any]`.
Another way to represent it would be to use a `List[Either[String,
Int]]`, but this doesn't scale for an arbitrary number of types.
Instead, what you might do, is represent the list using a nested
2-tuple. An example:

```scala

case object SENTINEL

val str = "String"
val sym = 'symbol
val i: Int = 0
val d: Double = 0.1

(str, (sym, (i, (d, SENTINEL))))
```

The expression has the type

```scala
(String, (Symbol, (Int, (Double, SENTINEL.type))))
```

Shapless basically does this, but defines a `::` class (similar to how
`Seq` is defined) and a `HNil` object to denote the end of the list. It
also provides macro-based methods to convert case classes to this
representation, and a host of other useful features.

Although I found this presentation very interesting, I didn't have much
of an interest in taking my understanding further until I encountered
the project
[julienrf/play-json-derived-codecs](https://github.com/julienrf/play-json-derived-codecs).

If you have ever used
[Play Framework](https://www.playframework.com/documentation/2.6.x/ScalaJson#Json),
you have probably used the its json implementation. One of the nice
things you can do, is to automatically create a JSON formatter
(`play.api.libs.json.Format`) for a
case class at compile time. Play uses a macro to do this.

```scala
import play.api.libs.Json

case class Employee(name: String)

object Employee {
  lazy val employeeJsonFormat = Json.format[Employee]
}

// Then you convert an employee to a JSON-string like:

Json.toJson(Employee("Bob")).toString
res: { "name": "Bob" }

// And read an employee from a JSON-string like:

Json.parse("""{ "name": "Bob" }""").validate[Employee]
res: JsSuccess(Employee("Bob"), _)
```

It's really convenient until you want to create a `Format` for all the
`case class`es which extend a `sealed trait`.

For example, you may define a `Drawing` like below, defining a `Group`
recursively as a `Drawing` which contains other `Drawing`s.

```scala
sealed trait Drawing
case class Circle(radius: Int) extends Drawing
case class Rectangle(width: Int, height: Int) extends Drawing
case class Group(drawings: Seq[Drawing]) extends Drawing
```

Implementing a `Format` for this is more tedious than you would expect.
It is something like:

```scala

sealed trait Drawing
object Drawing {
  implicit lazy val drawingFormat = new Format[Drawing] {
    override def writes(o: Drawing): JsValue = o match {
      case a: Circle => Json.toJson(a)
      case a: Rectangle => Json.toJson(a)
      case a: Group => Json.toJson(a)
    }
    override def reads(json: JsValue): JsResult[Drawing] =
      Circle.circleFormat.reads(json).orElse(
        Rectangle.rectangleFormat.reads(json).orElse(
          Group.groupFormat.reads(json)))
  }
}
case class Circle(radius: Int) extends Drawing
object Circle {
  implicit lazy val circleFormat = Json.format[Circle]
}
case class Rectangle(width: Int, height: Int) extends Drawing
object Rectangle {
  implicit lazy val rectangleFormat = Json.format[Rectangle]
}
case class Group(drawings: Seq[Drawing]) extends Drawing
object Group {
  implicit lazy val groupFormat = Json.format[Group]
}

```

Ignoring the problem that we do not encode type information anywhere in
the JSON, this is all tedious, repetitive boilerplate. There must be a
better way!

Enter `play-json-derived-codecs`, which you use as you'd expect:

```scala
sealed trait Drawing
object Drawing {
  implicit val drawingFormat = julienrf.json.derived.formats[Drawing]
}
case class Circle(radius: Int) extends Drawing
case class Rectangle(width: Int, height: Int) extends Drawing
case class Group(drawings: Seq[Drawing]) extends Drawing
```

That's it! What is this black magic?

How it works
============

Although the code to implement `play-json-derived-codecs` is really
short, I had to read a whole book to figure out how it works. Dave
Gurnell actually worked on a whole book on Shapeless called
[The Type Astronaut's Guide to Shapeless](https://underscore.io/books/shapeless-guide/).

This book is invaluable to understanding how things work, and explains
almost exactly how Shapeless is used in `play-json-derived-codecs`. In
case you'd rather not read the book yourself, continue reading to
discover how it works.

A `Format` is actually a combination of a `Reads` and a `Writes`. For
the sake of brevity, I will describe how the `Writes` works, as creating
a `Reads` is similar.

The first important thing to know about the way Play's JSON library
works is that to write a value as a `JsValue`, we must have an implicit
`Writes` for that type available. Some examples follow.

It is simple to create a `Writes` for a case class that uses only simple
types because `Writes` for all of these simple types have already been
defined.

```scala
case class Employee(name: String)
object Employee {
  implicit val writes = Json.writes[Employee]
}
```

And creating a `Writes[Hierarchy]` is simple once we have defined a
`Writes[Employee]`. We'd get an error about a missing `Writes[Employee]`
if we hadn't defined it above.

```scala
case class Hierarchy(supervisor: Employee, employee: Employee)
object Hierarchy {
  implicit val writes = Json.writes[Hierarchy]
}
```

This is important to know because we can see `Writes` are usually built
recusively. Here is our strategy to build something which creates
`Writes` for `sealed trait`s and their subclasses.

1. Convert a case class to its generic representation
2. Convert a generic representation (`HList`) to a `JsValue`
3. Somehow handle the relationship between traits and subclasses

# Generic

To convert a case class to its generic representation, we use the
`LabelledGeneric` class. This will encode not only the types of each
parameter but their names as well, which is required to create
`JsObject`s.

```scala
import shapeless._
case class Employee(name: String, age: Int)

LabelledGeneric[Employee].to(Employee("Jamie", 1))
res: String with labelled.KeyTag[Symbol with tag.Tagged[name], String] :: Int with labelled.KeyTag[Symbol with tag.Tagged[age], Int] :: HNil = "Jamie" :: 1 :: HNil
```

Calling `LabelledGeneric[Employee].to`, we get back an `HList` whose
first value is `"Jamie"`, a `String` tagged with the field name "name".
It is followed by the value `1`, which is an `Int` tagged with the field
name "age".

Let's see if we can create an `OWrites` for something like this. Below,
an `OWrites` is like a `Writes` but always writes things as a `JsObject`
instead of any `JsValue`.

When we encounter an `HNil`, we will return an empty object.

```scala
implicit def writeHNil = OWrites[HNil] { _ => Json.obj() }
```

`HNil` is the base case. For the other cases, we need to process the
`HList` as a head and tail.

```scala
implicit def owriteHList[Key, Head, Tail] = {

  val writesHead: Writes[Head] = ???
  val writesTail: OWrites[Tail] = ???
  val name = ???

  Writes[FieldType[Key, Head] :: Tail] {
    case head :: tail =>
      Json.obj(name -> writesHead.writes(head)) ++
        writesTail.writes(tail)
  }
}
```

And this is the definition of `FieldType` from Shapeless:

```scala
type FieldType[K, +V] = V with KeyTag[K, V]
```

Hopefully this definition is straightforward, but we are missing various
writes and the field name. How do we get these? We can get them through
implicit parameters that shapeless will provide. Using shapeless, the
code above becomes:

```scala
implicit def owriteHList[Key <: Symbol, Head, Tail <: HList](implicit
  fieldType: Witness.Aux[Key],
  writesHead: Lazy[Writes[Head]],
  writesTail: Lazy[OWrites[Tail]]) = {

  val name = fieldType.value.name

  OWrites[FieldType[Key, Head] :: Tail] {
    case head :: tail =>
      Json.obj(name -> writesHead.value.writes(head)) ++
        writesTail.value.writes(tail)
  }
}

```

`Witness` is a class which allows us to retrieve the field names used in
a `LabelledGeneric`'s `KeyTag`s. `Lazy` is a class which makes it easier for the
compiler to work with recursively-defined implicits.

We can use it right now if we are willing to convert `Employee`s to
`HList`s manually.

```scala
Json.toJson(
  LabelledGeneric[Employee].to(
    Employee("Jamie", 1))).toString
res: String = "{\"name\":\"Jamie\",\"age\":1}"
```

But why do that when we can do it automatically?

```scala
implicit def owritesGeneric[A, AsHListRep](implicit
  gen: LabelledGeneric.Aux[A, AsHListRep],
  owritesHList: Lazy[OWrites[AsHListRep]]
  ) = OWrites[A]{ a =>

  owritesHList.value.writes(gen.to(a))
}
```

We went right to the finalrimplementation, but hopefully it makes sense given
the previous one. First, we need a way to convert an `Employee` to its
`HList` representation. To do this, we need a `LabelledGeneric`. Then, we
need an `OWrites` for `HList`s. We just created that!

We've basically just replicated exactly what `Json.writes[Employee]`
will do, but in a more complicated way. Why? Remember that we want to be
able to automatically create a `Writes` for a `sealed trait` and its
implementations.

Shapeless represents a `sealed trait` and its implementors as a
`Coproduct`.

Recall our definition of a `Drawing`:

```scala
sealed trait Drawing
case class Circle(radius: Int) extends Drawing
case class Rectangle(width: Int, height: Int) extends Drawing
case class Group(drawings: Seq[Drawing]) extends Drawing
```

We can get a `LabelledGeneric` representation of a `Rectangle`:

```scala
LabelledGeneric[Drawing].to(Rectangle(1,2))
res: Circle with KeyTag[Symbol with tag.Tagged[Circle], Circle] :+: Group with KeyTag[Symbol with tag.Tagged[Group], Group] :+: Rectangle with KeyTag[Symbol with tag.Tagged[Rectangle], Rectangle] :+: CNil = Inr(Inr(Inl(Rectangle(1, 2))))
```

So we just need an `OWrites` for a `Coproduct`. We will recursively
write the list until we reach an `Inl`, at which point we know we have
the value we need, and can write that, along with type information.

```scala
implicit def owriteCoproduct[Key, Left, Right](implicit
  owritesLeft: OWrites[Left],
  owritesRight: OWrites[Right]) = {

  val typeName = ???
  OWrites[FieldType[Key, Left] :+: Right]{
    case Inl(left) => owritesLeft.writes(left
      ) ++ Json.obj("type" -> typeName)
    case Inr(right) => owritesRight.writes(right)
  }
}
```

And here is the code with all of the shapeless boilerplate added in.

```scala
implicit def owriteCoproduct[
  Key <: Symbol, Left, Right <: Coproduct](implicit
  fieldType: Witness.Aux[Key],
  owritesLeft: Lazy[OWrites[Left]],
  owritesRight: Lazy[OWrites[Right]]) = {

  val typeName = fieldType.value.name
  OWrites[FieldType[Key, Left] :+: Right]{
    case Inl(left) => Json.obj("type" -> fieldType.value.name
      ) ++ owritesLeft.value.writes(left)
    case Inr(right) => owritesRight.value.writes(right)
  }
}

```

We also need to define the base case, a `OWrites[CNil]`. Since we
shouldn't ever have a `CNil`, we throw an exception if we reach it.

```scala
implicit def owriteCnil = OWrites[CNil] { _ =>
  throw new Exception("shouldn't happen") }
```

Having done that, we can now write a `Rectangle`:

```scala
Json.toJson(Rectangle(1,2)).toString
res: String = "{\"width\":1,\"height\":2,\"type\":\"Rectangle\"}"
```

And a `Group`:

```scala
Json.toJson(Group(Seq(
  Rectangle(1,2), Circle(9)))).toString
res: String = "{\"drawings\":[{\"type\":\"Rectangle\",\"width\":1,\"height\":2},{\"type\":\"Circle\",\"radius\":9}]}"
```

We are pretty much done here. You'll notice that `play-json-derived-codecs` is
a *little* more complicated. Mostly, this is because it allows you to
specify `NameAdapter`s which control naming of case class fields, and a
`TypeTagOWrites` which allows you to customize how the `type` parameter
is manifested in the JSON.

Conclusion
==========

Above, we were introduced to the dependent type and generic programming
Scala library Shapeless. We learned about how Play Framework represents
JSON, and how we can use `Writes` to write types to `JsValue`s. Finally,
we learned how to use Shapeless to automatically create `Writes` for
`sealed trait`s and their subclasses, just like
[julienrf/play-json-derived-codecs](https://github.com/julienrf/play-json-derived-codecs) does.

Here's a [Scalafiddle](https://scalafiddle.io/sf/ON1iEVw/0)
showing the code that we worked on above. Press the **Run** button
to see the results.

<iframe height="400px" frameborder="0" style="width: 100%"
  src="https://embed.scalafiddle.io/embed?sfid=ON1iEVw/0&theme=dark&layout=v85"></iframe>

