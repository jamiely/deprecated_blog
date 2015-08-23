---
layout: post
status: publish
published: true
title: Generating offline maps for iOS applications
author: Jamie
author_login: Jamie
author_email: me@jamie.ly
author_url: http://jamie.ly
date: 2012-09-04
categories:
- Software
- Libraries
tags:
- iOS
- objective-c
- GIS
- postgres
- mapping
comments: []
---

Introduction
------------

Recently, I had to implement an offline mapping solution for an iOS application. Here's a walkthrough of how to do it.

Summary
-------

I generated a tile database using
[TileMill](http://mapbox.com/tilemill/). I used the [Route-Me iOS
library](https://github.com/route-me/route-me) which provides a map view
that supports offline tile sources.

TileMill
--------

Actually, generation of the tile database was the more time consuming
part of the task, especially since I had not worked with maps before.
Here's a run down of what it took. TileMill will help you style maps.
Getting started, I installed the application and tried to use built-in
features to style the map. I quickly realized I would need to import
some data sources to get the map I wanted. After more research, I found
this project called [OSM Bright](https://github.com/mapbox/osm-bright/)
by the company that produces TileMill, MapBox. I used the [OSM Bright
Mac OS X
Quickstart](http://mapbox.com/tilemill/docs/guides/osm-bright-mac-quickstart/)
to set everything up. The script that follows runs through most of the
steps required in the Quickstart.

### Database setup

Install GDAL complete, which is a prereq.

```bash
wget http://www.kyngchaos.com/files/software/frameworks/GDAL_Complete-1.9.dmg
hdiutil attach GDAL_Complete-1.9.dmg
open "/Volumes/GDAL Complete/GDAL Complete.pkg"
# Complete installation manually
```

Now, we'll setup Postgres and the PostGIS extension.

```bash
brew install postgresql

# libpng is a dependency of gdal,
# which is a dependency of postgis
brew install libpng && brew link -f libpng
brew install postgis

# initialize database
initdb /usr/local/var/postgres -E utf8

# creates a db for your username. For some reason
# initdb didn't do this for me and I was getting
# login issues without this existing.
createdb `whoami`
# make sure `which psql` = /usr/local/bin/psql
pg_ctl -D /usr/local/var/postgres \
  -l /usr/local/var/postgres/server.log start
psql -c "create database osm;"
psql -d osm -c "create extension postgis;"
```

### osm2pgsql Tool setup

Now, we'll setup the `osm2pgsql` tool which is used to load Open Street
Map data into a Postgres database.

```bash
# although there is a homebrew formula available,
# it did not seem to work on Mountain Lion
# brew install --HEAD osm2pgsql
wget http://dbsgeo.com/downloads/osm2pgsql/snow/intel/r26782.dmg
hdiutil attach r26782.dmg
open /Volumes/osm2pgsql-r26782M/osm2pgsql-r26782M.pkg
# Go through the installation instructions
```

### OSM data

We're done setting up our database that will store Open Street Map data.
Now, let's download the data we'll need. It's OSM data for the
Philadelpha Metro area in PBF format. 

```bash
# download relevant data from
# http://metro.teczno.com/#philadelphia
wget http://osm-metro-extracts.s3.amazonaws.com/philadelphia.osm.pbf
```
And then we import it into the database. 

```bash
osm2pgsql -c -G -d osm \
  -S /usr/local/share/osm2pgsql/default.style \
  philadelphia.osm.pbf
```

### Creating the TileMill project

Now, we can use the OSM Bright project to create a new TileMill project. 

```bash
git clone git://github.com/mapbox/osm-bright.git
cd osm-bright
# edit and add your postgres settings
vim configure.py
./make.py
```

This will create a new project in your TileMill projects directory,
which is probably `~/Documents/MapBox/project/`. The directory name will
be whatever was specified in `configure.py`.

### Exporting mbtiles from TileMill

Open TileMill and select your project. If you didn't change the name in `configure.py`, it will be called **OSM Bright**.

-   Edit the *Project Settings* by clicking the wrench icon at the top right. Zoom in on Philadelphia and change the `Center` location and `Bounds` using the interface.
-   Click save.
-   Click the *Export Menu* and select `MBTiles`. Select a zoom range.
    The higher the range you use, the larger your database will be. I
    though ranges between 13 and 18 worked best for my purposes. Save the
    `mbtiles` file with a name like `Philadelphia.mbtiles`.
-   The export will be queued and put in `~/Documents/MapBox/export/` when complete.

XCode Development
-----------------

### Project setup

Once you have created a new iOS application, we will setup the Route-Me
MapView as a subproject. Below, the Header Search Paths and Link
Binaries are the most important steps.

- Clone the Route-Me repo into a vendor directory inside your project.
  (This is the convention I used, and I'm not sure if it is the best)
  `git clone https://github.com/route-me/route-me vendor/route-me`
- Add the `vendor/route-me/MapView/MapView.xcodeproj` into your project.
- In your Project Settings, click the application target \> Build
  Settings \> Enter "Header" into the Search Box, and add
  `vendor/route-me/MapView/Map` to the \*\*Header Search Paths\* key
- Build Settings \> Under *Other Linker Flags* \> Add `-all_load -ObjC`
- Go to Build Phases \> Target Dependencies \> Click +, Choose MapView \> MapView
- Go to Build Phases \> Link Binaries \> For each of the following libraries, Click +, select the binary, and then click the Add button.
  - `libMapView.a`
  - `libsqlite3.dylib`
  - `CoreLocation.framework`
  - `QuartzCore.framework`
- Add the `Philadelphia.mbtiles` file you created before to the project.

### Development

Go to your storyboard or nib and add a subview to your primary view.
Give it the class `RMMapView`. Add outlets to your `UIViewController`
for this map view. Make sure to wire the outlets up in Interface Builder
as well.

```objective-c
// In your header file
#import <UIKit/UIKit.h>

@class RMMapView;

@interface MyViewController : UIViewController  {
  IBOutlet RMMapView *mapView;
}

@property (nonatomic, strong)
  IBOutlet RMMapView *mapView;
@end
```

```objective-c
// In your implementation file

#import "RMMapView.h"

// ...
@implementation MyViewController
@synthesize mapView;
// ...
```

Set the map's center point, default zoom level, and min and max zoom.
The min zoom should match the one you specified when you exported the
`mbtiles` file from TileMill.

```objective-c
// In your implementation file
- (void)viewDidLoad {
  // ...
  mapView.contents.minZoom = 15.f;
  mapView.contents.maxZoom = 17.f;
  mapView.contents.zoom = 16.5;
  [mapView.contents moveToLatLong:
    CLLocationCoordinate2DMake(
      39.949721,
      -75.150261)];
  // ...
}
```

```objective-c
// In your implementation file

#import "RMMBTilesTileSource.h" // Add this header

- (void)viewDidLoad {
  // ...

  mapView.contents.minZoom = 15.f;
  mapView.contents.maxZoom = 17.f;
  mapView.contents.zoom = 16.5;

  // the tile source *MUST* be set after min and max zoom
  NSURL *tileSetURL = [[NSBundle mainBundle]
    URLForResource:@"Philadelphia.mbtiles"
    withExtension:@"mbtiles"];
  mapView.contents.tileSource =
    [[RMMBTilesTileSource alloc]
    initWithTileSetURL: tileSetURL];

  [mapView.contents moveToLatLong:
    CLLocationCoordinate2DMake(
      39.949721,
      -75.150261)];
  // ...
}
```

Conclusion
----------

There you have it! You should have a map view displaying an
offline-accessible view of Philadelphia. Route-Me is a great library
which allows you to do other things like add paths and markers. If you
had problems with any part of this, please let me know. [An example
project is provided at
Github.](https://github.com/jamiely/PhiladelphiaOfflineMap) It uses a
tile database I generated myself using the instructions above.

