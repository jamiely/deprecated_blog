---
layout: post
title: "Holiday Soundboard"
date:   2013-12-11 07:00:00
categories: programming
tags:
  - holidays
  - sounds
  - sound board
comments: true
---

For our first annual, digital, family newsletter, we decided to have a
soundboard that played some of our daughter's first words. This post
describes the process of putting it together.

# Recording

I ordered an iPhone 5s as soon as I was able, and have been using it to
record many videos. I had been using a Droid Incredible for at least 4
years, having forfeitted one of my biannual upgrades.  Seeing the
lackluster quality of the video and pictures compared to my wife's
iPhone 4, I became increasingly disinclined to record media of either
kind. When my iPhone 5s came and I experienced the quality difference,
the shutterbug in me was disinterred. 

So, I had been recording lots of video of our child, capturing several
firsts, and everyday moments of play and babble. When sourcing for the
sound board, we encouraged our daughter to say some of her most common
words. While she often spoke unprompted in little morsels of sound, it
seemed our insistence (or my recording) dampened her loquaciousness.
Still, I captured what I could, thankful for a few choice morsels.

# Importing

On OS X, you can use the `Image Capture` program to import videos from
an iPhone. I imported the videos I had recorded in order to capture the
sounds.  Opening and viewing each one, in turn, in Quicktime, I found
the starting position of a sound. I followed the process described below
to extract each. 

# Clipping

Once the starting position of a sound was found, I used `ffmpeg` to
isolate that clip. On OS X, it's easy to install if you have
[brew](http://brew.sh/): `brew install ffmpeg`. Once it is installed,
you'll have the `ffmpeg` command on your `$PATH`. Assuming you identify a
clip at 3 seconds into `IMG_0000.mov`, with duration of approximately 5
seconds, you can issue the following command to extract it into a file
called `clip.mov`: 

```bash
ffmpeg -i IMG_0000.mov \
  -ss 00:00:03.000 -t 00:00:05.000 \
  -acodec copy -vcodec copy
  clip.mov
```

Listing the options used (with explanations from `ffmpeg`'s man page):

* `-i filename`: input file name
* `-t duration`: Stop writing the output after its duration reaches 
  duration.  duration may be a number in seconds, or in 
  "hh:mm:ss[.xxx]" form.
* `-ss position`: When used as an output option (before an output
  filename), decodes but discards input until the timestamps reach
  position.
* `-acodec codec`: Set the audio codec. 
* `-vcodec codec`: Set the video codec.

Unfortunately, I would often get the duration or the exact starting
point incorrect. To improve the evaluation cycle, I would view the
`clip.mov` file as soon as it was created, and adjust the `-ss` and `-t`
options accordingly. 

```bash
ffmpeg -i IMG_0000.mov \
  -ss 00:00:03.000 -t 00:00:05.000 \
  -acodec copy -vcodec copy
  clip.mov && \
open clip.mov
```

Once I was happy with the clip, I'd convert the clip to just audio (in
mp3 format), since this was an audio-only soundboard, and rename the
file accordingly.

```bash
ffmpeg -i clip.mov -acodec mp3 clip.mp3
```

# Rough HTML Page

Once that was done, with a bunch of mp3's, I wanted to get a quick and
dirty page up to play the sounds. I generated a bunch of audio tags
using a bash loop. 

```bash
INDEX=index.html
echo "<!DOCTYPE html><html><body>" > $INDEX
for i in *.mp3
  echo "<audio controls>
    <source src=\"$i\" type=\"audio/mpeg\">
    </audio>" >> $INDEX
echo "</body></html>" >> $INDEX
```

This created an ugly page, but one that I could use to display sounds.
See [fb1a873](https://github.com/jamiely/baby-sounds/tree/fb1a8735c69e38cf23a8cb03e43093da200a1ada).

# Refinement

When I was ready to improve the look of the page, I kept most of what
had been already done, but added some CSS classes, and some JavaScript
code to execute after the document was loaded. I kept the existing audio
elements so that the page could be responsive. 

Mainly, the scripts look for audio elements and use them to determine
what new DOM elements to create. Sound buttons are displayed using div's
styled to look like rounded buttons. These elements are each associated
with an audio element whose `play` function is invoked when the div
element is clicked. The original audio elements are hidden from display.

# Conclusion

See the `gh-pages` branch of the
[baby-sounds](https://github.com/jamiely/baby-sounds) repository for the
code, and you can visit the [baby-sounds
site](https://github.com/jamiely/baby-sounds) to see it for yourself.

