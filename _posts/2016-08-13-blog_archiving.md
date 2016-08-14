---
layout: post
status: publish
published: true
title: 'Blog Archiving'
author: Jamie
date: 2016-08-13
categories:
- Software
tags:
- wordpress
- jekyll
- blogging
---

The first place I posted journal entries online was the now-defunct
Asian community site
[Asian Avenue](https://en.wikipedia.org/wiki/AsianAve). During college,
[Xanga](http://xanga.com/) became really big and I started posting
there. Once I graduated and started getting some money in, I moved my
blog to self-hosted [Wordpress](https://wordpress.org/) on a shared
Dreamhost instance.

Well after static site generators like [Jekyll](https://jekyllrb.com/)
became popular, I decided to restart a blog using Jekyll and hosted on
[GitHub Pages](https://pages.github.com/). This has worked out for me
really well, helping to reduce monthly hosting costs.

The problem is what to do with my old blog hosted on Wordpress. Although
it's hosted on the cheapest [Digital Ocean](https://www.digitalocean.com/)
droplet available, I don't make any new entries and it requires running
mysql, which sometimes went down during higher traffic periods. (I setup
[supervisord](http://supervisord.org/) to restart the process
automatically when this problem occurs.)

I've wanted to archive it for awhile since it is fairly low traffic and
it can be static. There are three primary goals I had with archiving:

* To reduce my hosting costs (either real or in terms of resources used)
* To limit breaking existing links
* To limit content errors

Given these goals, I've had a number of approaches going back several
years. One of the things I've tried to do was to identify the most
visited pages and manually migrate them to the new blog, then setup
redirects to those pages using the
[Quick Page/Post Redirect Plugin](https://wordpress.org/plugins/quick-pagepost-redirect-plugin/).

This has worked fine but has not allowed me to reduce the Wordpress
site's footprint. I've also tried various import methods over the years,
attempting to convert the existing content to run on Jekyll. I've tried
both the official Wordpress importer available in the
[`jekyll-import` gem](http://import.jekyllrb.com/) and the
[`exitwp` tool](https://github.com/thomasf/exitwp). These work decently,
except that each had quirks in the import process.

The content imported by `jekyll-import` has the following problems:
1. Some characters are HTML entity encoded unnecessarily, breaking the
   markup. [There's a GitHub issue reporting this problem.](https://github.com/jekyll/jekyll-import/issues/254)
2. The import introduces `<br />` tags where they weren't in the
   original markup. This causes an issue especially with code examples.

The content imported by `exitwp` had the following problems:
1. It attempts to convert the post to Markdown, which resulted in issues
   with the markup with linked images.

Both of the tools have an additional drawback in that Wordpress
shortcodes are (understandably) ignored. Some examples of shortcodes
include:

* `[code]` used by the
  [SyntaxHighlighter Evolved](https://wordpress.org/plugins/syntaxhighlighter/) 
  plugin to highlight code
* `[embed]` [natively supported](https://codex.wordpress.org/Embeds) to embed media such as youtube videos
* `[gallery]` [natively supported](https://codex.wordpress.org/Gallery_Shortcode) to embed picture galleries

It's fairly straightforward to write code to translate
`[code]` shortcode tags into markdown-style code tags. Here's some ruby
code I wrote to do that:

```ruby
def replace_code(line)
  start_re = /\[code[^\]]*(?:\s+lang\s*=\s*"(\w+)")?[^\]]*\]/
  end_re = /\[\/code\]/

  line
    .gsub(end_re, '```')
    .gsub(start_re) do |_|
      match = Regexp.last_match
      '```' + ( match.captures.empty? ? '' : match.captures[0] )
    end
end
```

To replace the `[embed]` short tag, I used a
[Jekyll plugin](https://github.com/pibby/jekyll-youtube)
that simply takes the passed URL and writes `IFRAME` HTML for the
Youtube link.

Translating the gallery code is more difficult. One of the problems is
that although I can get a copy of `wp-content`, the directory where
Wordpress uploads post media, the directory tree is organized by year
and month (this may be configurable). I'm not sure how to determine
which images go with which post. There's probably a mapping in the
database somewhere, but it's just more to do.

Finally, I figured I should just find a way to save the static content
of Wordpress as is, instead of trying to convert it to Jekyll. I tried
the [WP Static HTML Output](https://wordpress.org/plugins/static-html-output-plugin/)
plugin, and it worked really well. After installing, you can go into a
special menu to download a static version of the site, including
JavaScript, CSS, and indexes by tag and category.

The unfortunate part is that making changes to layout is more difficult
because the layout is embedded into each page. Still, with a backup of
the Wordpress site, one could alter the layout and re-export the site.

There was one small problem with the output of the static site
generator. There were some weirdly encoded tags added to the output.
These were easy to strip out using `sed`, and less trouble than
filtering the `jekyll-import` and `exitwp` output. Here's an example
(note the `LC_ALL=C` is [some magic for sed on OS X](http://stackoverflow.com/questions/19242275/re-error-illegal-byte-sequence-on-mac-os-x))

```bash
find . ! -name '.git' -type f -name '*.html' \
  -exec env LC_ALL=C sed -i '' -e \
  "s#&lt;/p&gt;##g; s#&lt;pre&gt;&lt;code&gt;##g" {} \;
```

Since I wanted the code to have its own domain and I was already using
GitHub pages for my current blog, I deployed these static files on
[GitLab pages](https://pages.gitlab.io/) instead, and created a CNAME
for the new site [antiquity.jamie.ly](http://antiquity.jamie.ly). This
required adding a simple `.gitlab-ci.yml` file which described how to
deploy my site.

```yaml
# .gitlab-ci.yml
pages:
  stage: deploy
  script:
  - echo 'Nothing to do...'
  artifacts:
    paths:
    - public
  only:
  - master
```

Finally, I setup a redirect from the old site using `mod_rewrite`, that
forwarded all traffic to the new sub-domain, simply rewriting the old
URL to match the new format.

