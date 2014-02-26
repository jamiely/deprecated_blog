---
layout: post
title: "Loading a Properties File via context.xml"
date:   2014-02-26 07:00:00
categories: programming
tags:
  - java
  - tomcat
  - chef
  - devops
comments: false
---

# Intro

I'm working on a Java web application deployed as a WAR via Apache Tomcat.
The application settings are stored in a properties file 
deployed as a resource within the WAR. A 
[`PropertyPlaceholderConfigurer`](http://docs.spring.io/spring/docs/3.1.x/javadoc-api/org/springframework/beans/factory/config/PropertyPlaceholderConfigurer.html)
loads this properties file in order to configure bean instances.

# Deployment Issues

Initially I used a custom deploy script executing via SSH on a
successful Jenkins build. (Yes, I know I should've been using capistrano
or fabric.) This caused an issue when I went to deploy the application using 
[Chef](http://www.getchef.com/chef/). 

There is an
[`application_java`](https://github.com/poise/application_java) cookbook
that makes it easy to deploy WAR-based applications.  Unfortunately, the
way the properties are packaged with the WAR, I was using a hacky
work-around to create the properties using a `template resource` after
the application was deployed and exploded to the webapps directory. 

# Using a `context.xml` file

The way that it seems the `application_java` cookbook wants you to
specify app settings is via a `context.xml` file. A 
[Tomcat context](http://tomcat.apache.org/tomcat-7.0-doc/config/context.html)
provides two methods of passing variables: `context parameters` and
`environment entries`. I needed to use one of these methods to pass in
the location of the properties file used to configure the application.
(The `application` cookbook family encourages storing configuration in
the application's `shared` deploy directory.) I found a useful article
on StackOverflow [1], but I had to wade through several other references to
figure it out completely. Here are the steps I had to take, laid out
explicitly.

# Configuring the Configuration

Here's what I had to do:

1. Create an `env-entry` for variable `CONFIG_PATH` in the 
   application's `web.xml`.
2. Create an `Environment` element for variable `CONFIG_PATH` in the 
   application's `context.xml`. This is the file that will be used to 
   configure the application using Chef. Make sure the value begins with
   `file:` or you'll get an error like "Could not open ServletContext
   resource"
3. Add `jee` namespace to my `beans.xml` [2]
4. Add an entry to perform a *JNDI* lookup in my `beans.xml`:
   `<jee:jndi-lookup id="beanConfigPath" jndi-name="CONFIG_PATH"/>`
5. In my `beans.xml` `PropertyPlaceholderConfigurer` entry, reference
   the bean above:
   ```xml
   <bean id="propertyConfigurer" 
     class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">
     <property name="location" ref="beanConfigPath" />
   </bean>
   ```

# Conclusion

In retrospect, it may have been easy to try to use a *context parameter*
instead. I also had not heard of `JNDI` before I worked on this issue,
so that's another topic I need to look into. Still in the works is
making sure I can specify the location of a `logback.xml` file when I
deploy via Chef. Right now I'm looking into using the `Loader` element
of the `context.xml` in order to add the application's `shared`
directory to the classpath.

[1]: http://stackoverflow.com/questions/12391474/read-an-environment-variable-from-applicationcontext-xml
[2]: http://docs.spring.io/spring/docs/3.1.x/spring-framework-reference/html/xsd-config.html#xsd-config-body-schemas-jee


