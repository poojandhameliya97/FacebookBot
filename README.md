# FacebookBot
Facebook Bot for direct message to complaint receiver page  https://www.facebook.com/Complaint-Receiver-649351742191429/


Use npm start to start the server.

In .env file, enter your access token and verification token for webhook event.

Now, to deploy in heroku follow the below steps in terminal:

1) heroku login

2) heroku create

Now add the folder by git add .

3) git push heroku master


At last, open the heroku app and set the config variables of access token and verification token.

Here, we have also traied the app to know the type of complaint from the body itself. For this, we have used microsoft azure.
