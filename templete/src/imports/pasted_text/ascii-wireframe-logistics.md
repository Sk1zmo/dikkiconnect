Design a complete low-fidelity ASCII wireframe system (NOT high-fidelity UI) for a mobile-first logistics and intercity carpool platform.

STYLE

• Pure grayscale
• Wireframe only
• No colors
• No gradients
• No illustrations
• Boxes, placeholders and labels only
• ASCII inspired layout
• Every screen should look like a UX planning document
• Show navigation hierarchy
• Show components
• Show interactions
• Show empty states
• Show loading states
• Show error states
• Show bottom navigation
• Show floating buttons
• Show modal layouts
• Show sheets
• Show dialogs
• Show OTP screens
• Show scanning screens
• Show camera layouts
• Show dashboard layouts

The application has FIVE user roles.

1. Sender
2. Traveler (Driver)
3. Passenger
4. Hub Manager
5. Admin

==========================================================
APP STRUCTURE
==========================================================

Authentication

↓

Role Detection

↓

Choose Interface

↓

Sender
Traveler
Passenger
Hub Manager

Admin (Web)

==========================================================
BOTTOM NAVIGATION
==========================================================

Sender

Home
Bookings
Track
Wallet
Profile

Traveler

Dashboard
Trips
Scanner
Wallet
Profile

Passenger

Search
Bookings
Messages
Wallet
Profile

Hub Manager

Dashboard
Inventory
Scanner
History
Profile

==========================================================
SENDER FLOW
==========================================================

Splash

↓

Onboarding

↓

Login

↓

OTP Verification

↓

Home

Home contains

• Book Parcel
• Track Parcel
• Recent Orders
• Nearby Hub
• Active Deliveries
• Promotions

Book Parcel

Step 1
Select Cities

From

↓

To

Step 2

Parcel Type

Weight

Dimensions

Declared Value

Fragile

Category

Notes

↓

Price Estimate

↓

Choose Hub

↓

Payment

↓

Booking Confirmed

↓

Generate QR

↓

Tracking Screen

Tracking timeline

Booked

↓

Dropped at Hub

↓

Picked by Traveler

↓

In Transit

↓

Destination Hub

↓

Collected

Each stage has

Timestamp

Driver

Hub

OTP

Photos

Status

==========================================================
TRAVELER FLOW
==========================================================

Dashboard

Today's Trips

Available Jobs

Wallet

Vehicle

Ratings

Create Trip

↓

Origin

↓

Destination

↓

Departure Time

↓

Vehicle

↓

Available Space

↓

Seats

↓

Publish Trip

Available Parcels

Card View

Parcel

Distance

Reward

Weight

Pickup Hub

Destination Hub

Accept

↓

Navigate

↓

Reach Hub

↓

Scan QR

↓

Enter OTP

↓

Pickup Confirmed

↓

Route Navigation

↓

Destination Hub

↓

Scan

↓

OTP

↓

Drop Completed

Wallet

Trips

History

Ratings

==========================================================
PASSENGER FLOW
==========================================================

Search Ride

Origin

Destination

Date

↓

Ride Results

Driver

Rating

Vehicle

Seats Left

ETA

Price

↓

Ride Detail

↓

Book

↓

Payment

↓

Boarding OTP

↓

Live Tracking

↓

Trip Complete

↓

Rate Driver

==========================================================
HUB MANAGER FLOW
==========================================================

Dashboard

Today's Summary

Incoming

Outgoing

Held Inventory

Revenue

Parcel Intake

Scan Parcel

Parcel Weight

Photo

OTP

Confirm

Inventory

Cards

Waiting

Assigned

Delayed

Lost

Traveler Pickup

Traveler Arrives

↓

Generate OTP

↓

Traveler Enters OTP

↓

Release Parcel

Receiver Pickup

↓

Receiver OTP

↓

Delivered

History

Reports

Settlement

==========================================================
ADMIN WEB
==========================================================

Sidebar

Dashboard

Users

Drivers

Passengers

Trips

Parcels

Payments

Disputes

Analytics

Settings

Dashboard

KPIs

Revenue

Trips

Deliveries

Live Vehicles

Pending OTP

Maps

Recent Activity

Users

Search

Filters

Verification

Ban

Suspend

Approve

Driver Detail

Vehicle

KYC

Trips

Wallet

Documents

Parcels

Grid

Timeline

Status

Tracking

Payment

Analytics

Graphs

Cities

Revenue

Trip Density

Parcel Volume

Driver Growth

Hub Performance

==========================================================
COMMON SCREENS
==========================================================

Notifications

Wallet

Support

Chat

Help Center

Settings

Profile

Edit Profile

KYC Status

Payment Methods

Emergency Contacts

Documents

==========================================================
MODALS
==========================================================

Confirm Booking

Cancel Booking

Cancel Ride

Parcel Details

Driver Details

Rating

OTP

QR Scanner

Photo Capture

Payment Success

Payment Failed

==========================================================
COMPONENT LIBRARY
==========================================================

Primary Button

Secondary Button

Danger Button

Cards

Status Chips

Progress Bar

Bottom Sheet

Modal

Search

Map

Timeline

Tracking Card

Driver Card

Parcel Card

Trip Card

Wallet Card

QR Code

OTP Input

Camera Frame

Scanner Overlay

Notification Card

Floating Action Button

Navigation Drawer

Segmented Control

Tab Bar

Stepper

==========================================================
STATE SCREENS
==========================================================

Loading

No Trips

No Parcels

No Drivers

Offline

Payment Failed

OTP Incorrect

Location Disabled

Network Error

Permission Denied

Empty Wallet

No Notifications

==========================================================
ASCII LAYOUT STYLE
==========================================================

Example

+------------------------------------------------+

LOGO

Home

Search Bar

-------------------------

[ Book Parcel ]

[ Track Parcel ]

[ Nearby Hub ]

-------------------------

Recent Orders

+ Parcel Card +

+ Parcel Card +

-------------------------

Bottom Navigation

Home | Track | Wallet | Profile

+------------------------------------------------+

Every page should follow this style.

==========================================================
OUTPUT
==========================================================

Generate approximately

• 90–120 mobile wireframes
• 12+ web admin pages
• User flow connections
• Navigation map
• Component library
• Design system foundations
• Responsive layouts
• Tablet layouts for Hub Manager
• Desktop layouts for Admin
• Complete UX architecture

The output should resemble a professional UX blueprint suitable for handing directly to UI designers before visual design begins.