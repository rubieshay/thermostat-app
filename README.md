# ThermoPal
# Open Source Web-based app to control Google Home/Smart Device Compatible Thermostats

## Why would I need this? Can't I just use Google Home?

You can absolutely use the Google Home App on your phone to perform all of the functions available in this app, and sometimes more (cases where the Google Home App is using features/functions in undocumented API calls, such as accessing the information that the thermostat is reporting about when the HVAC will reach the desired temperature, and other information).

Sometimes, however, you are at your computer and your phone isn't easily accessible, or it's just too much of a break in flow to get your phone and start the app.  For those of you that used to have Nest thermostats, you could always control your apps from home.nest.com. With the latest thermostats, however, they are no longer Nest branded and no longer work with the Nest web app.  

So -- that's the gap this fills -- a web-based app to control your thermostat.

## How does this work?

There are two components to this. One is a "backend" web-server component, and the other is a frontend web-site.

The backend web server serves up a simple API to the frontend to provide current thermostat data, which in turn uses the Google Smart Device Management API to retrieve the data. The backend and also sets up a "subscription" for changes in data thermostat data, so that it doesn't need to poll for changes coming from changes in room temperature, or any other control of the thermostat, and changes just as the HVAC cycles on and off.  Whenever a change is received by the backend server, it uses WebSockets to communicate these changes to the frontend.  The backend also serves up outdoor weather data to the frontend.

The frontend is a react/typescript application that communicates with the backend to get device and general weather information.  

## Why is there both a backend and a frontend? Couldn't this all be in a frontend app?

Sure, it could be, but that application would need access to multiple pieces of sensitive information needed from setup in Google's projects and authorization keys. In order to keep these private, as well as to have just one central point for getting thermostat data and updates, regardless of how many people might have the application up, this architecture was selected.

## OK, How do I use this if I want to?

There are really a set of steps here, the most complicated of which are setting up your Google device management project, a separate cloud project, getting all the credentials correct, and then setting up the Google Pub/Sub service as well.  Once that is all done, you can run your code on your own machine, the easiest way being using docker. If you want to try it without docker, you can kind of infer what to do based on what is happening in the docker-compose file provided.

## What are the steps?

### Background Reading

Read the information from Google on Device Management [available here](https://developers.google.com/nest/device-access/registration) including the quick start guide. You will need to register for all appropriate accounts and there is a one-time fee of $5 .  From what I can tell so far, I don't think I will personally incur any other charges -- the PubSub service is a billable service but the free-use tier seems to be large enough for my usecase of 1 thermostat. Please investigate for your personal situation, however -- YMMV. 

Other great reading is available on [this page](https://www.home-assistant.io/integrations/nest) for Home Assistant.  Wait, why shouldn't you just use Home Assistant? Again, you probably should. It's wildly capable of controlling a million home devices. This use case was just a simple/beautiful single page application to control a thermostat, without all of the other (great) stuff.

Other important references include [this page](https://github.com/potmat/homebridge-google-nest-sdm?tab=readme-ov-file). The relevant pieces of the instructions are the "one important difference" about the URL you click on to authorize, which includes the Pub/Sub services in the link.

### Creating a Google Cloud Project

Follow the instructions on the Home Assistant project above

### Create OAuth client id/secret for this project

Again, follow those instructions.

### Creating a Service Account and retrieving credentials

In my case, I also needed to create a service account and ket a JSON service account key to make the application work. To do this, on the Google Cloud Project, go to APIs and Services, then Credentials.  From there, go to Service Accounts, and choose to create a new one.  Make sure it has roles for Pub/Sub editor, Service Account Token Creator, and Service Account User.

On the Keys tab for the service account, create a new key in JSON format.  The service account key JSON file will be saved to your local Downlaods folder automatically.  Keep this file secure.

### Creating a Google Device Management project

Follow the Home Assistant instructions above.

### Setting Up the Pub/Sub Service

Follow the Home Assistant instructions above.

### Starting up the process and getting your refresh token

Follow the Google getting started guide. On the "Authorize an account" step where you link your Google account, making sure you change the URL aligned with the Homebridge document above on the "one important difference" section.  The URL that should be used, documented there, is https://nestservices.google.com/partnerconnections/project-id/auth?redirect_uri=https://www.google.com&access_type=offline&prompt=consent&client_id=oauth2-client-id&response_type=code&scope=https://www.googleapis.com/auth/sdm.service+https://www.googleapis.com/auth/pubsub .  

This step gets you an authorization code. Use this authorization code with curl on the command line to get an access token and a refresh token. Save the refresh token somewhere securely.

Make the initial API call to the devices API as documented in the guide, again using curl, to activate the service.

### Run the application with docker-compose

Start with the docker-compose file documented [here](https://github.com/rubieshay/thermostat-app/tree/main/docs/docker-simple/docker-compose.yaml).

Update the environment variables as described in the file. Key variables include:

* On the frontend, DEFAULT_API_URL. The docker-compose file is set to http://localhost:3333 , which is where the backend will be by default.  This can be changed if you need to run on a different port or URL.
* All on the backend:
* PROJECT_ID : Google cloud project ID
* CLIENT_ID: Oauth client ID setup in the above steps
* CLIENT_SECRET: Related client secret
* REFRESH_TOKEN: Token retrieved in the step above
* PORT: defaults to 3333, it will be the port that is part of the frontend's DEFAULT_API_URL unless other services like Caddy or other reverse proxies get in the middle of.
* DEMO_MODE: Usually zero or false. If set to true, the backend will not make any google or weather API calls and just return defaulted data. Good for testing the frontend and access.
* ENVIRONMENT: String will be appended as part of the pub/sub subscription ID, no other uses.
* PUBSUB_PROJECT_ID: Google Device Access project ID (not google cloud ID)
* GOOGLE_APPLICATION_CREDENTIALS: The path where the container can find the service account key JSON file. The docker volume bind statement will need to place it in this location. For instance if this is /var/gsecrets/service-account-key.json, make sure your docker volume binds to /var/gsecrets and has the service-account-key.json file locally to bind mount inside.
* WEATHER_LATITUDE: The google device management API has no way to tell where your google home location is, so this must be provided for local weather to work appropriately.
* WEATHER_LONGITUDE: As above
* DEFAULT_CORS_ORIGIN: The backend automatically accepts any connections from localhost. If you are using Caddy or some other reverse proxy to run it at a different location or hostname, put that here, such as "https://thermostat.mytld.com". No need to include the "/api" part of the endpoint. 

Check that the volume bind mounts have the service account key JSON file in them, as defined by the GOOGLE_APPLICATION_CREDENTIALS settting.

Once everything has been set, do "docker-compose up" and you should see logging from the backend. Access the frontend locally [here](http://localhost:3333) if you are set to run on localhost on port 3333 as is the default.

Once this is working, you can run this somewhere other than localhost using a reverse proxy like traefik or caddy, as your preference is. This should typically only entail changing the "DEFAULT_API_URL" variable on the frontend to point at the backend. For instance, you might have "thermostat.mytld.com" run the frontend server, then "thermostat.mytld.com/api" run the backend server, assuming your proxy can route specific paths to different services. In this case, DEFAULT_API_URL would be "https://thermostat.mytld.com/api" and DEFAULT_CORS_ORIGIN would be "https://thermostat.mytld.com".

Alternatively, you could run the backend at "thermostat-service.mytld.com" and the frontend at "thermostat.mytld.com". In this case, DEFAULT_API_URL would be "https://thermostat-service.mytld.com" and DEFAULT_CORS_ORIGIN would be "https://thermostat.mytld.com".  All assuming your reverse proxy also provides https / certificate services. There is nothing specific to the app about https, all native functionality is provided over http.



