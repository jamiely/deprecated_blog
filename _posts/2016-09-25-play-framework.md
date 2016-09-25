---
layout: post
status: publish
published: true
title: Play Framework Miscellany
author: Jamie
date: 2016-09-25
categories:
- Software
tags:
- scala
- playframework
---

# Intro

I've used Play for the past couple years, mostly using version 2.3. For
various reasons, I haven't worked with 2.4 or above, so some of the
things I'll mention below may be dated.

Overall it's a great framework with a lot of things included. I prefer
opinionated frameworks, since they make getting started a lot more
straight forward. For newer developers, they provide a happy path that
they can follow to avoid frustration.

One of the problems with batteries-included frameworks is that if you
veer off the happy path, sometimes it's difficult to find your way
without combing through the source code. I'll describe some features and
techniques I've used that address some things you may be interested in
after having worked with the framework for awhile.

Fair warning: this post is disorganized, but I plan to update it as I
think of new things to add.

# Templates

One of my favorite features of Play is the Twirl templates library. The
templates you write will be compiled into Scala code along with the
benefits that offers (type-safety). Although coding in a compiled
language is obviously a little more clunky and verbose than a dynamic
language, refactoring is much easier thanks to the compiler's checks.

Templates are typically put into the `views` directory. The simplest
template is a blank file. For example, `views/simple.scala.html` would
get compiled into a object defined as follows:

```scala
package views.html

import play.twirl.api._
import play.twirl.api.TemplateMagic._
import play.api.templates.PlayMagic._
import models._
import controllers._
import play.api.i18n._
import play.api.mvc._
import play.api.data._
import views.html._

/**/
object simple extends BaseScalaTemplate[
  play.twirl.api.HtmlFormat.Appendable,Format[play.twirl.api.HtmlFormat.Appendable]](play.twirl.api.HtmlFormat)
  with play.twirl.api.Template0[play.twirl.api.HtmlFormat.Appendable] {
  def apply():play.twirl.api.HtmlFormat
  .Appendable = {
      _display_ {
Seq[Any]()}
  }
  def render(): play.twirl.api.HtmlFormat.Appendable
    = apply()
  def f:(() => play.twirl.api.HtmlFormat.Appendable)
    = () => apply()
  def ref: this.type = this
}
```

It's fairly verbose for something that displays nothing, but I've never
had to look at this generated content other than to see how it works.

We can change the `views/simple.scala.html` file to this:

```html
@()
```

A template which takes 0 arguments. The generated code is the same as
above. Adding a single argument such as an `Int` will change the types slightly.
The new template is:

```html
@(index: Int)
```

And the generated code, omitting some unchanged code, becomes:

```scala
object simple extends BaseScalaTemplate[play.twirl.api.HtmlFormat.Appendable,Format[play.twirl.api.HtmlFormat.Appendable]](play.twirl.api.HtmlFormat) with play.twirl.api.Template1[Int,play.twirl.api.HtmlFormat.Appendable] {
  def apply/*1.2*/(index: Int):play.twirl.api.HtmlFormat.Appendable = {
      _display_ {
Seq[Any]()}
  }
  def render(index:Int): play.twirl.api.HtmlFormat.Appendable = apply(index)
  def f:((Int) => play.twirl.api.HtmlFormat.Appendable) = (index) => apply(index)
}
```

It is mostly the same accept that the `Int` type has been added as a
function argument in various places, and as a type parameter in other
places.

Let's add some content to the template and check out the result. Here's
the new template, display the index variable in a paragraph tag:

```html
@(index: Int)
<p>@index</p>
```

And the new generated code is the same except for the `apply` function

```scala
  // ... unchanged code elided
  def apply/*1.2*/(index: Int):play.twirl.api.HtmlFormat.Appendable = {
      _display_ {

Seq[Any](format.raw/*1.14*/("""
"""),format.raw/*2.1*/("""<p>"""),_display_(/*2.5*/index),format.raw/*2.10*/("""</p>"""))}
  }
```

`format.raw` and `_display_` are used to render raw HTML and escaped
content, respectively.

# Supported code

The template engine is particular about some of the code that's used.
For example, if you want to use an if-else block, you have to write it
like:

```html
@if(condition) {
  <p>true</p>
} else {
  <p>false</p>
}
```

Rather than:

```html
@if(condition) {
  <p>true</p>
}
@else {
  <p>false</p>
}
```

Imports are okay:

```html
@import play.api.mvc

<p>test</p>
```

`val` declarations are not:

```html
@(index: Int)

@val test = 1

<p>@test</p>
```

Unless you combine it with an import into a single line:

```html
@import play.api.mvc; val test = 1;
<p>@test</p>
```

This may be an oversight of the Twirl parser. It's also possible to
accomplish something similar via a `reusable block`.

```html
@test = { 1 }
<p>@test</p>
```

or `reusable code block`:

```html
@test = @{ 1 }
<p>@test</p>
```

This block gets written as a `def` in the generated object:

```scala
def apply/*1.2*/(index: Int):play.twirl.api.HtmlFormat.Appendable = {
    _display_ {
def /*3.2*/test/*3.6*/ = {{ 1 }};
Seq[Any](format.raw/*1.14*/("""

"""),format.raw/*3.15*/("""
"""),format.raw/*4.1*/("""<p>"""),_display_(/*4.5*/test),format.raw/*4.9*/("""</p>"""))}
}
```

# Partials

[Rails]() coined the term `partials` for resuable templates that can be
included in other templates. I use an underscore prefix to denote
partial templates. Let's say we want have the following models:

```scala
package models
case class Student(id: Int, name: String)
case class Course(
  name: String,
  students: Seq[Student])
```

And the following views `views/_studentTable.scala.html`:

```html
@(students: Seq[models.Student])
<ul>
  @for(student <- students) {
    <li>@student.name</li>
  }
</ul>
```

and `views/course.scala.html`:

```html
@(course: models.Course)
<h1>@course.name</h1>
@_studentTable(course.students)
```

# View Configuration

When we have many templates calling different partials, we may want to
configure the partials in different ways as determined by the
controller. I've found the most straightforward way of dealing with this
is to create some view configuration object which gets passed to
template or partial, and contains and variables or methods required by
the view. For example, if we wanted to override how the partial renders
students we could do the following. In `views/Config.scala`:

```scala
package views
import models._
case class Config(
  render: Student => String = _.name)
```

Then we change modify the `views/_studentTable.scala.html` to add this
parameter:

```html
@(students: Seq[models.Student],
  config: views.Config)
<ul>
  @for(student <- students) {
    <li>@config.render(student)</li>
  }
</ul>
```

Then we can have the students' ids appear when listed in the course
view:

```html
@(course: models.Course)
<h1>@course.name</h1>
@_studentTable(
  course.students,
  views.Config(render = s => s.name + " " + s.id))
```

# Forms

Although the documentation has a good explanation of how to use forms
and form validation, it doesn't have an opinion on how to organize
things. I'll go over my preferred way of organizing this.

Let's say we want validation for creating a `Course` instance. I create
an `object CourseForm` in a `forms` package containing two members.

```scala
object CourseForm {
  import play.api.data._
  import Forms._

  val mapping = Forms.mapping(
    "name" -> nonEmptyText,
    "students" -> seq(StudentForm.mapping)
  )(Course.apply)(Course.unapply)
  val form = Form(mapping)
}

object StudentForm {
  import play.api.data._
  import Forms._

  val mapping = Forms.mapping(
    "id" -> number,
    "name" -> nonEmptyText
  )(Student.apply)(Student.unapply)
  val form = Form(mapping)
}
```

First, there is a
[`mapping: Mapping[T]`](https://www.playframework.com/documentation/2.3.x/api/scala/index.html#play.api.data.Mapping)
which makes it easy to bind form fields to an object. Next, there is a
[`form:
Form[T]`](https://www.playframework.com/documentation/2.3.x/api/scala/index.html#play.api.data.Form)
which is used in form rendering and validation. `CourseForm.mapping`
makes uses of `StudentForm.mapping` instance, which is defined similarly
allowing for easier code reuse.

All of [the docs regarding form submission](https://www.playframework.com/documentation/2.3.x/ScalaForms)
show passing the mapping directly to the form, but separating things
like this provides a lot of flexibility.

# Form Validators

The validators that are built-in will get you most of the way you want,
but there are many cases for custom validators. One general validator I've
commonly had need of which is not part of the `play.api.data.Forms`
object is what I call `choice`. `choice` validates that the input is one
in a given list of choices. We can define `choice` like this:

``` scala
def choice[T](mapping: Mapping[T], choices: Set[T]): Mapping[T] =
  mapping.verifying { t =>
    choices.contains(t)
  }
```

and use it like so:

```scala
import play.api.data._

val sizes = choice(
  nonEmptyText,
  Set("small, medium, large")))

val myForm = Form(
  Forms.single("sizes" -> sizes))
```

# Anorm

Here's an example of using anorm to read a SQL table. First, the table:

```sql
CREATE TABLE students (
  id int PRIMARY KEY,
  name varchar(500)
);
```

We define a corresponding case class first:

```scala
case class Student( id: Int, name: Option[String] )
```

Then we use anorm to query for it:

```scala
import anorm._

def getStudents: Seq[Student] = {
  import play.api.Play.current
  DB.withConnection { implicit connection =>
    SQL"select * from students".as(parser.*)
  }
}

val parser: RowParser[Student] = {
  import SqlParser._

  int("id") ~
    str("name").?
    .map ( flatten )
    .map ( Student.apply _ tupled )
}
```

While this works well for case classes, if we're using Scala 2.10 and
have more than the member-limit of fields we need to populate, what can
we do?

Assuming there is some class with more than 22 members, we can define a
parser as follows:

```scala
val parser: RowParser[Student] = {
  import SqlParser._

  val subParser1 = str("field1") ~
    str("field2") ~
    // ...
    str("field22")
    .map(flatten)

  val subParser1 = str("field23") ~
    str("field24") ~
    // ...
    str("field44")
    .map(flatten)

  // now combine the parsers

  subParser1 ~ subParser1 map flatten map {
    case (
      (field1, ..., field22),
      (field23, ..., field24)) =>
      // create instance
  }
}
```

# Testing

The provided manual has great information on testing, but here are a few
extra bits of information I've come to find useful.

# Testing Controllers

Pre 2.4 there is no built-in DI, and although
[controller injection](https://www.playframework.com/documentation/2.3.x/ScalaDependencyInjection)
is supported, the default way to create a controller is to create a
companion object. This makes it difficult to unit test. The simplest way
to get around this, especially in a codebase that already exists, is to
change the companion object into a trait, rename it appropriately, then
create a new companion object that just extends from this trait. Say we
have the following controller:

```scala
object MyController extends Controller {
  def index = Action { Ok }
}
```

We change it to this instead:

```scala
trait MyControllerLike extends Controller {
  def index = Action { Ok }
}
object MyController extends MyControllerLike
```

This allows us to easily unit test this controller by extending this
trait in a test class:

```scala
class TestController extends MyControllerLike {
  // override some method
}

// test the index method
val controller = new TestController
val result = controller.index(FakeRequest())
// confirm result is as expected
```

# Test Logging

Sometimes we want to log during test runs. Assuming you are using the
Play logger to do this, and create a play logger for each class by
mixing in a trait like this:

```scala
trait LoggerSupport { self =>
  implicit lazy val logger =
    play.api.Logger(self.getClass.getName.replaceAll("\\$$", ""))
}
```
[Ref][1]

Then you can add a `test/resources/logger.xml` file to
configure test logging.

[1]: https://gist.github.com/Pyppe/6083801

