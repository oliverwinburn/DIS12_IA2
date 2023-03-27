# 12 Digital Solutions IA2 Website 
This is a website created for a digital solutions assignment.


The website must:
- Listen to incoming serial data from an Arduino describing the temperature and humidity of a room
- Periodically request external temperatures from the Bureau of Meteorology (BOM)
- Store this information into a database
- Provide temperature and humidity information to a user connected via a web interface
- Alert the user if the temperature goes over a certian threshold


This repository does not contain the code to run the sensor on the arduino. Though, valid information is a JSON encoded string of `{temp: number, humidity: number}` sent around every second.