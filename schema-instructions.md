# Reusable Function Requirements for URL Visit & Schema Validation

## Objective

Create a **reusable function** that will **visit all URLs one by one** from given link in example because there might be 50 up pages
#### Example
here at this url we have all the links of pages
https://portlandpartybuscompany.com/sitemap/

------------------------------------------------------------------------

## Tasks Performed on Each Page
**validate multiple items** on each webpage.

### **1. Schema Validation**

When visiting a page, the function must determine **which schema(s)**
exist on the page and validate them based on page type.

------------------------------------------------------------------------

## Expected Schemas by Page Type

### **1. Home Page**

Home page must contain **3 schemas**: - `LocalBusiness` - `Product` -
`WebSite`

### **2. City Pages**

City pages must contain **3 schemas**: - `LocalBusiness` -
`BreadcrumbList` - `Product`

### **3. All Other Pages**

Other pages must contain **2 schemas**: - `Product` - `BreadcrumbList`

------------------------------------------------------------------------

## BreadcrumbList Validation Rules

### **Breadcrumb items may vary**

-   Some pages have **2 ListItems**
-   Some pages have **3 ListItems**

### **For pages with 3 ListItems**

The **3rd ListItem** contains the **slug**, which MUST match the URL
endpoint.

#### Example

**URL:**\
`https://santaclaritapartybuscompany.com/14-passenger-sprinter-limousine/`

**Expected slug:**\
`14-passenger-sprinter-limousine`

------------------------------------------------------------------------

## Example Schemas Present on Pages

### **LocalBusiness Schema**

``` html
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "${website_url}#localbusiness",
  "name": "${default_city} Party Bus Company",
  "url": "${website_url}",
  "logo": "${_img-${default_city_small}-party-bus-company-logo}",
  "telephone": "+1-${mobile_num_text}",
  "description": "${default_city} Party Bus Company is a highly rated provider of limousine buses, sprinter vans, charter buses, minibuses & party buses in ${default_city}, ${default_state} open 24/7/365. Experienced reservation agents are available at ${mobile_num_text}",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress":"Downtown",
    "addressLocality": "${default_city}",
    "addressRegion": "${default_address_region}",
    "addressCountry": "${default_country}",
    "areaServed": "${default_city}, ${default_address_region}"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  }]
}</script>
```

### **Product Schema**

``` html
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${default_city} Party Bus Company",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "${ratingValue}",
    "bestRating": "${bestRating}",
    "reviewCount": "${reviewCount}"
  }
}</script>
```

### **Website Schema**

``` html
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${default_city} Party Bus Company",
  "url": "${website_url}"
}</script>
```

### **BreadcrumbList Schema (2 Items)**

``` html
<script type="application/ld+json">{
  "@context":"https://schema.org/",
  "@type":"BreadcrumbList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"${website_url}"},
    {"@type":"ListItem","position":2,"name":"Our ${default_city} Fleet","item":"${website_url}our-fleet/"}
  ]
}</script>
```

### **BreadcrumbList Schema (3 Items)**

``` html
<script type="application/ld+json">{
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"${website_url}"},
    {"@type":"ListItem","position":2,"name":"Our ${default_city} Fleet","item":"${website_url}buses/"},
    {"@type":"ListItem","position":3,"name":"${slug}","item":"${website_url}${slug_key}/"}
  ]
}</script>
```

------------------------------------------------------------------------

## Global Variables Used

``` js
const globalVariables = {
  default_city: "Portland",
  default_state: "Oregon",
  default_city_small: "portland",
  default_address_region: "OR",
  default_country: "US",
  mobile_num_text: "971-360-9450",
  website_url: "https://portlandpartybuscompany.com/",
  ratingValue: "9.9",
  bestRating: "10",
  reviewCount: "29",
};
```

# Final Goal
Final Requirement is to generate a testcase which compares all pages schema word to word 
website_url