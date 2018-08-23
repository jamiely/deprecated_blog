---
layout: post
status: published
published: true
title: Using R with ggplot2
author: Jamie
date: 2018-11-01
categories:
- 
tags:
- r
- rlang
- ggplot2
- graphics
- visualization
---

Intro
====

[R](https://www.r-project.org/) is a popular language used to analyze data
and create graphics based on data. This article describes using R to process
IRS data and create related graphics.

Data
====

We'll be looking at zipcode-level data for Pennsylvania from 2014. The data
is available on the
[IRS Website](https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics-2014-zip-code-data-soi).

Although there is a CSV file that contains the data we need, it has headers with
special names that need to be decoded. If this were not a one-off project, I'd
use the CSV, but there is also
[an Excel file that contains only Pennslyvania data]( https://www.irs.gov/pub/irs-soi/14zp39pa.xls).
I thought it would be a good exercise to try to read and work with the data in
this format.

First, we'll install the packages we'll need to use throughout this post.

```r
install.packages(
  c("gdata", "geosphere", "rgdal", "maptools", "ggplot2", "plyr"))
library(gdata)
library(geosphere)
library(rgdal)
library(maptools)
library(ggplot2)
library(plyr)
```

Next, we will download and read the Excel file into our R workspace.

```r
# Create a temporary file path to store the file in
xlspath <- tempfile()
# Download the file to that temporary path
download.file('https://www.irs.gov/pub/irs-soi/14zp39pa.xls', xlspath)
# Read the file into an R dataframe without converting strings to factors,
# and replacing any "** 0" cells with NAs.
irs2014_raw <- read.xls(xlspath, stringsAsFactors = FALSE, 
  na.strings = c("** 0"))

irs2014_edited <- irs2014_raw
```

Here's what the file looks like if we open it in Excel or LibreOffice.

![Spreadsheet sample]({{ site.baseurl }}/assets/20181101_excel_format.png)

Since the spreadsheet is obviously written for human instead of machine
consumption, there are a few things we need to do to normalize the file.

1. Create proper column names for the dataframe
2. Remove blank entries
3. Reformat the data to remove totals, making it a more clean dataset

Rename all the columns from `c1` to `c129`.

```r
irs2014_edited.columncount <- ncol(irs2014_edited)
irs2014_edited.columns_sequence <- 1:irs2014_edited.columncount
names(irs2014_edited) <- paste("c", irs2014_edited.columns_sequence, sep="")
```

Filter the dataset to just the header row, so that we can get the row number
that it starts on. We will assume that the header row is a row which has the
text "ZIP\ncode" in the first column. That's the word "ZIP", followed by a
newline, followed by the word "code". We can drop all of the rows that occur
befor the header.

```r
original_header <- irs2014_edited[grepl("ZIP\ncode", irs2014_edited$c1),]
original_header_row <- as.numeric(rownames(original_header))
row_count <- nrow(irs2014_edited)
omit_original_header_sequence <- original_header_row:row_count
irs2014_edited <- irs2014_edited[omit_original_header_sequence,]
```

Due to merged cells in the header, there are header cells which are empty. We'll
make the assumption that if a header cell is empty, then that cell's text should
match the cell to its left.

```r
last <- ""
for (col in names(irs2014_edited)) {
  value <- irs2014_edited[1, col]
  if(is.na(value) || value == "") {
    irs2014_edited[1, col] <- last
  }
  else {
    last <- value
  }
}
```

There is a subheader beneath the primary header. We want to merge the two. We
will do that by prefixing all of the subheader cells with the text in the cell
right above it. We'll trim leading and trailing whitespace in the resulting text.
Then, we drop the the header row from our data frame.

```r
for(col in names(irs2014_edited)) {
  irs2014_edited[2, col] <- trimws(paste(
    irs2014_edited[1, col], irs2014_edited[2, col]))
}

irs2014_edited <- irs2014_edited[-1,]
```

The spreadsheet has internal column numbers that we want to remove underneath
the original subheader. 

```r
internal_cols_row <- which(irs2014_edited == "(-1)", arr.ind = TRUE)[1]
irs2014_edited <- irs2014_edited[-internal_cols_row,]
```

And we need to remove aggregate and blank rows inside ths spreadsheet so that
our sums will be accurate, by filtering to rows which DO NOT contain these
values. We make the assumption that these rows will have the word "Total" or
an empty string in the second column.

```r
values_to_remove <- c("Total", "")
irs2014_edited <- irs2014_edited[!(irs2014_edited$c2 %in% values_to_remove),]
```

Next, we want the data frame column names to match what we currently have in
the first, header row. We can drop the header row afterwards.

```r
names(irs2014_edited) <- gsub("[\r\n]", " ", irs2014_edited[1,])
irs2014_edited <- irs2014_edited[-1,]
```

Those are the major changes necessary to begin working with the data.

Working with the data
=====================

It seems as if all the columns after the second column are numeric, so we can
convert them all so that calculations will work like we expect.

```r
for (col in 3:ncol(irs2014_edited)) {
  irs2014_edited[,col] <- as.numeric(as.character(irs2014_edited[,col]))
}
```

To make our code easier to work with, we will create a new data frame containing
just the data we need, with simple names.

```r
irs2014 <- data.frame(
  incomeFactor = as.factor(irs2014_edited$`Size of adjusted gross income`),
  returns = irs2014_edited$`Number of returns`,
  income  = irs2014_edited$`Total income Amount`,
  zip = irs2014_edited$`ZIP code [1]`
)
```

What percentage of returns is each Gross Income class?
======================================================

We can answer this by summing the returns by the `incomeFactor` column.

```r
returns_by_incomeFactor <- aggregate(returns ~ incomeFactor, data=irs2014, sum)
```

```
             incomeFactor returns
1        $1 under $25,000 4562430
2 $100,000 under $200,000 1487590
3        $200,000 or more  469030
4   $25,000 under $50,000 2822410
5   $50,000 under $75,000 1719250
6  $75,000 under $100,000 1137580
```

We can see the ordering is a bit awkward, so let's reorder this.

```r
returns_by_incomeFactor$min_value <- c(1, 100000, 200000, 25000, 50000, 75000)
returns_by_incomeFactor <- returns_by_incomeFactor[
  order(returns_by_incomeFactor$min_value), ]

# but we also need to specify the order of the factor's levels
returns_by_incomeFactor$incomeFactor <- factor(
  returns_by_incomeFactor$incomeFactor,
  levels=unique(returns_by_incomeFactor$incomeFactor))
```

```r
             incomeFactor returns min_value
1        $1 under $25,000 4562430         1
4   $25,000 under $50,000 2822410     25000
5   $50,000 under $75,000 1719250     50000
6  $75,000 under $100,000 1137580     75000
2 $100,000 under $200,000 1487590    100000
3        $200,000 or more  469030    200000
```

That's better. Let's try to visualize this with a simple bar graph.

```r
bar <- ggplot(returns_by_incomeFactor,
    aes(incomeFactor, weight=returns, fill=incomeFactor)) +
  geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust=1)) +
  ggtitle("Returns By Gross Income") +
  ylab("Returns") +
  labs(fill = "Gross Income") +
  xlab("Gross Income")
plot(bar)
```


![2014 Returns by Gross Income Bar Graph]({{site.baseurl}}/assets/20181101_returns_by_gross_income_bar_multiple.png)

```r
bar_single <-
  ggplot(returns_by_incomeFactor, 
    aes(x="", y=returns, fill=incomeFactor)) + 
  geom_bar(stat="identity") + 
  ggtitle("Returns By Gross Income") +
  ylab("Returns") +
  labs(fill = "Gross Income") +
  xlab("")

plot(bar_single)
```

![2014 Returns by Gross Income Bar Graph]({{site.baseurl}}/assets/20181101_returns_by_gross_income_bar_single.png)

And a pie chart, [if that's your thing](https://www.businessinsider.com/pie-charts-are-the-worst-2013-6),
although they look terrible in ggplot.

```r
pie <-
  ggplot(returns_by_incomeFactor, 
    aes(x="", y=returns, fill=incomeFactor)) + 
  geom_bar(width=1, stat="identity") + 
  ggtitle("Returns By Gross Income") +
  ylab("") +
  xlab("") +
  labs(fill = "Gross Income") +
  coord_polar("y") +
  theme(axis.text.x=element_blank())
plot(pie)
```

![2014 Returns by Gross Income Pie Chart]({{site.baseurl}}/assets/20181101_returns_by_gross_income_pie.png)

# What are the areas with the highest gross income?

We can visualize the data geospatially by using some of ggplot2's map
visualizations. The concept is that we have arbitrary regions whose shape is
defined by a list of points (longitude and latitude). These regions have ids
which we will map to ids in our data.

Although there are certain shapes included with `ggplot2`, including state and
county shapes, there are no shapes by zipcode. There are some existing R
packages that provide zipcode shapes, but we will retrieve them from the source.
[Pennsylvania Spatial Data Access](http://www.pasda.psu.edu/uci/DataSummary.aspx?dataset=3076)
is one such source of shape data. We can download a zip file from this location,
and unzip it somewhere.

```r
# Create a couple temporary paths
shapefile_path <- tempfile()
output_path <- tempfile()

# Download the file from the FTP server
download.file(
  'ftp://ftp.pasda.psu.edu/pub/pasda/census/tl_Pennsylvania5Digit2009.zip',
  shapefile_path)

# Unzip the archive containing the shapefiles
unzip(shapefile_path, exdir = output_path)

# Load the shapefile
pazips_shapes_raw <- readOGR(dsn=output_path, layer="tl_Pennsylvania5Digit2009")
```

We need to preprocess the data to use it for maps. We will use `fortify` to
create a dataframe from the shapefile model. `pazips_points` contains the
points for each zipcode shape.

```r
pazips_points = fortify(pazips_shapes_raw)
```

```
       long      lat order  hole piece id group
1 -80.01641 40.35900     1 FALSE     1  0   0.1
2 -80.01634 40.35940     2 FALSE     1  0   0.1
3 -80.01629 40.35954     3 FALSE     1  0   0.1
4 -80.01621 40.35968     4 FALSE     1  0   0.1
5 -80.01609 40.35983     5 FALSE     1  0   0.1
6 -80.01594 40.35995     6 FALSE     1  0   0.1
```

We also do some processing on the data with respect to each shape (zipcode).
`pazips_data` contains shape/zipcode-level data. `pazips_data$id` corresponds
to the `pazips_points$id`

```r
pazips_data <- pazips_shapes_raw@data
pazips_data$id <- rownames(pazips_data)
```

```
  ZCTA5CE CLASSFP MTFCC FUNCSTAT     ALAND AWATER    INTPTLAT     INTPTLON id
0   15236      B5 G6350        S  26601853      0 +40.3437143 -079.9777046  0
1   15213      B5 G6350        S   5954744   8799 +40.4431746 -079.9554052  1
2   15136      B5 G6350        S  24770071      0 +40.4680072 -080.1010063  2
3   15202      B5 G6350        S  11605997      0 +40.5066279 -080.0695996  3
4   15082      B5 G6350        S    606828      0 +40.3751608 -080.2151494  4
5   15057      B5 G6350        S 137051089 211171 +40.3587623 -080.2437771  5
```

Because we want to avoid mapping all of the zipcodes in PA, we will limit the
map to an area surrounding Willow Grove Mall. Each zipcode has a centroid
defined by columns `INTPTLAT` and `INTPTLON`. We will add a column giving the
number of meters that centroid is from Willow Grove Mall.

```r
willow_grove_mall_coords <- c(-75.1257827,40.1401633)

# Convert the centroid coordinate to numeric for calculation
pazips_data$clong <- as.numeric(as.character(pazips_data$INTPTLON))
pazips_data$clat <- as.numeric(as.character(pazips_data$INTPTLAT))

# Gives the distance in meters
pazips_data$distance_from_wg <- distm(
  pazips_data[,c("clong", "clat")], willow_grove_mall_coords, fun=distCosine)
```

And filter results to include only zipcodes that are nearby.

```r
# Filter results to zipcodes up to 15 miles away
meters_in_mile <- 1610
distance_away <- meters_in_mile * 12
pazips_nearby <- pazips_data[pazips_data$distance_from_wg < distance_away,]

# Filter to only those zipcodes used above
pazips_points_nearby <- pazips_points[pazips_points$id %in% pazips_nearby$id,]
```

Next, we will sum gross income by zipcode. We will also make sure that centroids
are included.

```r
income_by_zip_raw <- aggregate(income ~ zip, data=irs2014, sum)
pazips_data$zip <- pazips_data$ZCTA5CE
income_by_zip_with_centroids <- join(income_by_zip_raw, pazips_data, by="zip")

# We reformat the dataframe above into a new dataframe containing only the
# fields we need because extra fields can cause issues with ggplot in that
# ggplot makes certain assumptions about field names.
income_by_zip <- data.frame(
  id = income_by_zip_with_centroids$id,
  income = income_by_zip_with_centroids$income,
  zip = income_by_zip_with_centroids$zip,
  clong = income_by_zip_with_centroids$clong,
  clat = income_by_zip_with_centroids$clat
)
income_by_zip <- income_by_zip[income_by_zip$id %in% pazips_nearby$id,]
```

```
       id income   zip     clong     clat
1139   43 986997 18914 -75.20939 40.29260
1140  358  49222 18915 -75.25679 40.27258
1144  877 413211 18925 -75.06159 40.28338
1145  448 550635 18929 -75.07849 40.25429
1148 1449  14045 18936 -75.22923 40.22598
1155  659 584713 18954 -74.99296 40.22541
```

Finally we create the map:

```r
# We reformat the dataframe pazips_points to have the keys the ggplot expects
# in map dataframes.
map_points <- data.frame(
  id = pazips_points_nearby$id,
  x = pazips_points_nearby$long,
  y = pazips_points_nearby$lat
)
ggplot(income_by_zip, aes(fill=income)) +
  geom_map(aes(map_id = id), map=map_points) +
  # geom_label adds a background color to the text, making it easier to read.
  geom_label(aes(label=zip, x=clong, y=clat), color="white") +
  expand_limits(map_points)
```

![PA Income by Zipcode map]({{ site.baseurl }}/assets/20181101_pa_zipcode_income_map.png)
