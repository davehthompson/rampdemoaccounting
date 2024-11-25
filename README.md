# Receipt Collector Application

A Node.js application that automates receipt collection and memo processing via SMS using Twilio. This application allows users to submit receipts and memos through text messages after making a card purchase, streamlining the expense documentation process.

## 🌟 Features

- Automated SMS communications using Twilio
- Receipt image collection and processing
- Memo collection for expense documentation
- State management for user interactions
- Secure webhook endpoints for Twilio integration
- Local tunnel support for development and testing

## 🔧 Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn package manager
- Twilio account with:
  - Account SID
  - Auth Token
  - Twilio phone number
- Internet connection for tunnel functionality

## 📦 Dependencies

- `express`: Web application framework
- `body-parser`: Request body parsing middleware
- `twilio`: Twilio API client
- `localtunnel`: Exposes local server to the internet
- `axios`: HTTP client for external requests

## ⚙️ Configuration

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
PORT=3000 (optional, defaults to 3000)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## 🚀 Getting Started

1. Start the server:
```bash
node server.js
```

2. The application will:
   - Start on the specified port (default: 3000)
   - Automatically create a tunnel using localtunnel
   - Display the public URL for configuring Twilio webhooks

## 💬 User Flow

1. **Card Swipe**: When a user swipes their card, the system initiates the process
2. **Receipt Request**: User receives SMS requesting receipt image
3. **Receipt Submission**: User sends receipt image via MMS
4. **Memo Request**: System requests a memo for the expense
5. **Memo Submission**: User sends memo text
6. **Completion**: System confirms completion of the process

## 🔄 State Management

The application manages user interactions through the following states:

- `NEW`: Initial state when user starts interaction
- `AWAITING_RECEIPT`: Waiting for receipt image
- `AWAITING_MEMO`: Waiting for expense memo
- `COMPLETE`: Process completed

## 🔍 API Endpoints

- `POST /` or `POST /webhook`: Main Twilio webhook endpoint
- `GET /test-connection`: Test endpoint for checking server status
  - Returns current server time and database state

## 🛠️ Development Features

- Comprehensive request logging
- Error handling middleware
- Support for various content types
- In-memory database for user state management
- Automatic tunnel creation for local development

## ⚠️ Security Notes

- Current implementation uses in-memory storage (not suitable for production)
- Twilio credentials should be properly secured
- Consider implementing authentication for the test endpoint

## 🚧 Production Considerations

1. Replace in-memory database with persistent storage
2. Implement proper authentication and authorization
3. Add request rate limiting
4. Set up proper error monitoring and logging
5. Configure secure environment variable management
6. Implement backup and recovery procedures

## 📝 Logging

The application includes detailed logging of:
- All incoming requests
- Request headers and body
- SMS delivery status
- Error conditions
- Server startup and tunnel status

## 🐛 Troubleshooting

1. **SMS Not Sending**
   - Verify Twilio credentials
   - Check phone number format
   - Review server logs for errors

2. **Webhook Issues**
   - Ensure tunnel is running
   - Verify Twilio webhook configuration
   - Check server logs for request details

3. **State Management Issues**
   - Server restart will clear in-memory database
   - Check current state via test endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[Add appropriate license information]

## 👥 Contact

[Add contact information]
