---
layout: post
title: Create a DVD on MacOS
date: 2019-01-01 09:00:00
categories: programming
tags:
  - dvd
  - ruby
  - bash
  - ffmpeg
comments: false
---

Introduction
============

Although I hadn't created a DVD-video disc since college, working on Windows XP
using Adobe Premiere, when we got a Honda Odyssey with built-in DVD-player,
I knew I would want to burn some DVDs to enjoy in the car.

Since it seems no DVD authoring software is installed on MacOS by default, I
looked up solutions, finding mostly outdated, pre-Sierra software. The two
most promising options are Roxio Toast, which is around $100, and
[DVDStyler](https://sourceforge.net/projects/dvdstyler/) which is free.

Use the CLI
===========

These options may be what you need, but I only need video files burned directly
to DVD without menus. I often have a number of files I want to burn, and create
DVDs in bursts. Here's my workflow, derived from reading a number of sources
[3], [4]. To follow along, you'll need to install
[Homebrew](https://brew.sh/), and then use it to install a few programs.

* `ffmpeg` converts video from one format to another
* `dvdauthor` writes files into a DVD file layout
* `cdrtools` contains the `mkisofs` program which creates a DVD-video ISO

```bash
brew install ffmpeg dvdauthor cdrtools
```

We will make a few assumptions here:

* We want to burn DVDs in [NTSC](https://en.wikipedia.org/wiki/PAL#PAL_vs._NTSC)
  format (probably the case have a US DVD player)
* We want a video aspect ratio of 16:9 (widescreen). You may not want this aspect
  ratio if you are burning family movies from the 90s

We will do the following things to create our DVD:

* Convert our video files to the appropriate format
* Create a DVD file layout
* Create an [ISO](https://en.wikipedia.org/wiki/ISO_9660) to burn onto a DVD
* Burn the DVD

First, we need to convert all of our files to the format the DVDs use.

```bash
ffmpeg -i my_recorded_video.mp4 -target ntsc-dvd -aspect 16:9 my_dvd_video.mpg
```

`ffmpeg` can convert between many different formats, so you don't need to have an
`mp4` source video.

It may be easier to batch convert videos. This will convert all of the `mp4`s in
the current directory to `mpg` files. _This will have an issue with filenames
containing spaces._

```bash
for i in $(ls *.mp4); do
  ffmpeg -i "$i" -target ntsc-dvd -aspect 16:9 "${i/mp4/mpg}"
done
```

Next, we will use `dvdauthor` to create the contents of the DVD. To do this,
we will create an XML control file [1] that lists the contents of the DVD. It looks
like this:

```xml
<dvdauthor>
  <vmgm />
  <titleset>
    <titles>
      <pgc>
        <vob file="file1.mpg" />
        <vob file="file2.mpg" />
      </pgc>
    </titles>
  </titleset>
</dvdauthor>
```

Then, we can launch `dvdauthor` referencing the control file:

```bash
dvdauthor -o dvd_output/ -x dvd_control_file.xml
```

`dvdauthor` writes a `VIDEO_TS` folder inside of the `dvd_output` directory.
With the dvd contents in a directory, we can now create the ISO. We'll use
the `mkisofs` program, which has a special setting for creating dvd video ISOs.
[2]

```bash
mkisofs -dvd-video -o dvd.iso my_dvd/
```

Finally, we burn the ISO onto a blank DVD.

```bash
hdiutil burn dvd.iso
```

# Automating

All the above can be automated. Since I use the size of `mpg`s to get a sense of
how many will fit on one disk, I do the conversion using `ffmpeg` manually.
Note that `DVDStyler` will do this step automatically and will change encoding
to fit more video into a DVD if that's what you want.

The goal is to be able to pass a list of `mpg` files to a script and have them
burned onto a DVD. First, we will write a script that generates the `dvdauthor` XML control
file based on these submitted files. We will save this as `make_dvd_xml.rb`:

```ruby
#!/usr/bin/env ruby

require 'erb'
require 'tempfile'

class Program
  def get_file_paths
    files = ARGV.map do | file |
      File.absolute_path file
    end.select do | file |
      File.exists? file
    end.select do | file |
      file.end_with? ".mpg"
    end

    files
  end
  def get_xml_contents(file_paths)
    <<-HEREDOC
    <dvdauthor>
      <vmgm />
      <titleset>
        <titles>
          <pgc><% files.each do |file| %>
            <vob file="<%= file %>" /><% end %>
          </pgc>
        </titles>
      </titleset>
    </dvdauthor>
    HEREDOC
  end
  def write_dvdauthor_xmlfile!(files)
    template = ERB.new get_xml_contents(files)
    xml_path = tempfile('dvdauthor.xml')
    File.open(xml_path, 'w') do | xml_file |
      xml_file.write(template.result(binding))
    end
    xml_path
  end
  def write(files)
    xmlfile = write_dvdauthor_xmlfile!(files)
    return if xmlfile.nil?
    puts xmlfile
  end
  def run!
    files = get_file_paths
    write(files)
  end

  private 
  def tempfile(prefix)
    File.expand_path(Dir::Tmpname.make_tmpname(prefix, nil), Dir::Tmpname.tmpdir)
  end
end

Program.new.run!
```

Next, we will create a bash script to run all of the commands. We will name
this `make_dvd`:

```bash
#!/usr/bin/env bash

set -e

run() {
  local iso_path=$1
  shift

  echo "Creating iso $iso_path"

  # create xml file
  local control_xml_path=$(make_dvd_xml.rb $@)
  local dvd_dir=$(mktemp -d -t dvd)

  echo "Running dvdauthor with dvd_dir=$dvd_dir and control_xml_path=$control_xml_path"
  dvdauthor -o "$dvd_dir" -x "$control_xml_path"

  mkisofs -dvd-video -o "$iso_path" "$dvd_dir"

  rm -rf "$dvd_dir" "$control_xml_path"

  echo "Burning dvd using iso $iso_path"
  hdiutil burn "$iso_path"
  drutil eject

  echo "Done"
  rm -rf "$iso_path"
}

run $@
```

And now we can use `make_dvd_xml.rb` and `make_dvd` by placing it somewhere
on the `$PATH`. If `1.mpg` and `2.mpg` are in the working directory, then we
can use the command like this:

```bash
make_dvd 1.mpg 2.mpg
```

Sometimes I want a notification when the burn is done:

```bash
make_dvd 1.mpg 2.mpg && say "Come and get it!"
```

TTY Weirdness?
==============

Originally, I tried to have a Ruby script spawn all of these processes, but
`dvdauthor` in particular did something weird where it would not write all of
the same files when I spawned it in Ruby using the `pty` library. Comparing
the results to when I ran the program via bash, there were some files missing
in the output (using the same input).

Extra Credit
============

It should be possible to estimate the final size of the video using the
duration of the video. You can get the duration of a video in seconds by
using:

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 input.mp4
```

A standard DVD can hold between 120-133 minutes of video. We should be able
to write a program which will take all of the input videos, figure out the
durations, and do something with that information. For example, we could add
a warning when the total duration is under a certain number. We could exit on
error if the duration exceeds 133 minutes. We could throw out videos until we
get under a duration of some maximum minutes.

Let's modify `make_dvd` to do this. We need to know the duration of a media file:

```bash
get_media_seconds() {
  local media_path="$1"
  local seconds=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$media_path")
  echo $seconds
}
```

And we need to be able to get the total duration, in minutes, of a list of
media:

```bash
get_all_media_minutes() {
  local sum=0
  for media_path in "$@"; do
    local seconds=$(get_media_seconds "$media_path")
    sum=$(echo "$sum + $seconds" | bc)
  done
  local minutes=$(echo "$sum / 60" | bc)
  local floor=$( printf "%.0f" $minutes )
  local ceiling=$(( $floor + 1 ))
  echo $ceiling
}
```

We will use this method to test a list of media. If the media is longer than
a maximum duration, we'll re-run our code with the last media item in the list
removed.

```bash
validate_minutes() {
  local minutes=$1

  if [[ $minutes -gt $MAXIMUM_DURATION_IN_MINUTES ]]; then
    return 1
  fi
}

run() {
  # elided
  if ! validate_minutes $minutes; then
    run "$iso_path" ${@:1:$(($#-1))}
    return $?
  fi
  # elided
}
```

We can combine the concepts, along with some extra settings into a final script.

```bash
#!/usr/bin/env bash

# If this flag is set, the last video on the list will be removed until
# the videos fit in the preferred duration
REMOVE_VIDEOS_UNTIL_FITS=${REMOVE_VIDEOS_UNTIL_FITS:-"y"}
# The maximum duration for dvds. Note that actual duration varies due to
# encoding differences. This should be set to some intelligent upper-bound.
# If you repeatedly encounter ISOs that are too large, you should dial this
# default setting down.
MAXIMUM_DURATION_IN_MINUTES=${MAXIMUM_DURATION_IN_MINUTES:-130}

set -e

debug() {
  local msg="$1"
  >&2 echo "$msg"
}

get_media_seconds() {
  local media_path="$1"
  local seconds=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$media_path")
  # debug "Media $1 seconds=$seconds"
  echo $seconds
}

get_all_media_minutes() {
  local sum=0
  for media_path in "$@"; do
    local seconds=$(get_media_seconds "$media_path")
    sum=$(echo "$sum + $seconds" | bc)
  done
  local minutes=$(echo "$sum / 60" | bc)
  local floor=$( printf "%.0f" $minutes )
  local ceiling=$(( $floor + 1 ))
  echo $ceiling
}

validate_minutes() {
  local minutes=$1

  if [[ $minutes -gt $MAXIMUM_DURATION_IN_MINUTES ]]; then
    debug "Duration of $minutes may not exceed $MAXIMUM_DURATION_IN_MINUTES minutes"
    return 1
  fi
}

run() {
  local iso_path=$1
  shift

  local minutes=$(get_all_media_minutes $@)
  
  if ! validate_minutes $minutes; then
    if [[ "$REMOVE_VIDEOS_UNTIL_FITS" == "y" ]]; then
      debug "@@ We'll remove the last video"
      run "$iso_path" ${@:1:$(($#-1))}
      return $?
    else
      return 1
    fi
  fi

  echo "Creating iso $iso_path from $minutes minutes of video: $@"

  # create xml file
  local control_xml_path=$(make_dvd_xml.rb $@)
  local dvd_dir=$(mktemp -d -t dvd)

  echo "Running dvdauthor with dvd_dir=$dvd_dir and control_xml_path=$control_xml_path"
  dvdauthor -o "$dvd_dir" -x "$control_xml_path"

  mkisofs -dvd-video -o "$iso_path" "$dvd_dir"

  rm -rf "$dvd_dir" "$control_xml_path"
}

run $@
```

[1]: http://dvdauthor.sourceforge.net/doc/x35.html
[2]: https://www.linuxquestions.org/questions/linux-software-2/using-mkisofs-to-make-a-dvd-iso-image-567894/
[3]: https://docs.salixos.org/wiki/How_to_create_a_video_DVD_from_the_command_line
[4]: https://evilshit.wordpress.com/2015/08/10/how-to-create-a-video-dvd-with-command-line-tools/