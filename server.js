const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const localtunnel = require("localtunnel");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// Your Twilio account SID and auth token
const accountSid = "ACe99695a640a6a4a0fa3478b8f63cbf3d";
const authToken = "8a3d184e195a655644cab9503e8578b3";

// Create a Twilio client
const client = twilio(accountSid, authToken);

// In-memory database
const userDatabase = {};

// Parse incoming requests with urlencoded payloads
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} request to ${req.url}`
  );
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Parse incoming requests with various content types
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "*/*" }));

const twilioPhoneNumber = "+18556389087";
// User interaction states
const STATES = {
  NEW: "NEW",
  AWAITING_RECEIPT: "AWAITING_RECEIPT",
  AWAITING_MEMO: "AWAITING_MEMO",
  COMPLETE: "COMPLETE",
};

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} request to ${req.url}`
  );
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  next();
});

// Parse incoming requests with various content types
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Function to send SMS
async function sendSMS(to, body) {
  if (!twilioPhoneNumber) {
    console.error("TWILIO_PHONE_NUMBER environment variable is not set");
    return;
  }
  try {
    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log("Message sent with SID:", message.sid);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

// Webhook handler function
async function handleWebhook(req, res) {
  console.log("Webhook handler function called");
  try {
    const fromNumber = req.body.From;
    const hasMedia = req.body.NumMedia !== "0";

    if (!userDatabase[fromNumber]) {
      // New user
      userDatabase[fromNumber] = {
        state: STATES.NEW,
        name: "Dave Thompson", // You would set this when you add a new entry
        company: "Ramp", // You would set this when you add a new entry
      };
      await sendSMS(
        fromNumber,
        "You have successfully swiped your card! 💳✅ -- Can you send us the receipt please?! 🧾"
      );
      userDatabase[fromNumber].state = STATES.AWAITING_RECEIPT;
    } else {
      switch (userDatabase[fromNumber].state) {
        case STATES.AWAITING_RECEIPT:
          if (hasMedia) {
            await sendSMS(
              fromNumber,
              "We have successfully received your receipt! Processing now... 🧾📊"
            );
            userDatabase[fromNumber].state = STATES.AWAITING_MEMO;
            await sendSMS(
              fromNumber,
              "We have succesfully processed your receipt and matched to a transaction! All we need is a memo 📝"
            );
          } else {
            await sendSMS(fromNumber, "Please send your receipt image 🖼️");
          }
          break;
        case STATES.AWAITING_MEMO:
          if (!hasMedia) {
            // Assuming memo is text, not an image
            await sendSMS(fromNumber, "All set! Thank you. 👍");
            userDatabase[fromNumber].state = STATES.COMPLETE;
          } else {
            await sendSMS(
              fromNumber,
              "Please send your memo as text, not an image 🚫🖼️"
            );
          }
          break;
        case STATES.COMPLETE:
          await sendSMS(
            fromNumber,
            "Your transaction is already complete. Start a new one by swiping your card again. 🔄💳"
          );
          break;
      }
    }
  } catch (error) {
    console.error("Error in webhook handler:", error);
    res.status(500).send("Internal Server Error");
  }
}

// Root path webhook endpoint
app.post("/", handleWebhook);

// Keep the /webhook endpoint as well, in case it's needed in the future
app.post("/webhook", handleWebhook);

// Test endpoint for checking internet connection
app.get("/test-connection", async (req, res) => {
  res.json({
    status: "success",
    message: "Server is connected to the internet",
    serverTime: new Date().toISOString(),
    userDatabase: userDatabase, // This will show the current state of the in-memory database
  });
});

// Catch-all endpoint for unhandled routes
app.use((req, res) => {
  console.log(`Unhandled route: ${req.method} ${req.url}`);
  res.status(404).send("Not Found");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).send("Something broke!");
});

// Start the server and set up localtunnel
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  // Set up localtunnel
  (async () => {
    try {
      const tunnel = await localtunnel({
        port: port,
        subdomain: "ramp",
      });

      console.log(`Server is now accessible at: ${tunnel.url}`);
      console.log("For Twilio webhook, use this URL in your Twilio console");

      tunnel.on("close", () => {
        console.log("Tunnel closed");
      });
    } catch (error) {
      console.error("Error setting up localtunnel:", error);
    }
  })();
});
