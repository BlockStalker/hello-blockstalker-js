import { blockStalkerClient, restClient, FilterFormBuilder, NumericCondition, KeyGroup, KeyType, KeyEvent } from '@blockstalker/client-js';

const local_apiKey = 'YOUR_API_KEY_HERE'; 
// Note: If NodeJS > 20, we recommend using a .env file for your API key
const apiBaseURL = "https://api.blockstalker.io";

const apiKey = process.env.BLOCKSTALKER_API_KEY || local_apiKey;
const mainClient = blockStalkerClient(apiKey, apiBaseURL);

/*
  ____  _____ ____ _____      _    ____ ___ 
 |  _ \| ____/ ___|_   _|    / \  |  _ \_ _|
 | |_) |  _| \___ \ | |     / _ \ | |_) | | 
 |  _ <| |___ ___) || |    / ___ \|  __/| | 
 |_| \_\_____|____/ |_|   /_/   \_\_|  |___|

*/

// Customize restClient to set global options (i.e. request/response tracing)
const rc = restClient(apiKey, apiBaseURL, { trace: false });

// Otherwise you can simply use blockStalkerClient:
const myStreams = await mainClient.rest.streams.owned();
console.log("Your streams:", myStreams);

// Get Personal Stream
const streams = await rc.streams.owned();
const personalStream = streams.personal;
console.log("Personal stream:", personalStream);

//
// Create a Key-based filter for USDC (US Dollar Coin) transfers >= 5 USDC
//
// USDC = Asset Id: 31566704
// Note: Key-based filters are processed first, and are a more efficient use of your Match Credits
const usdc = await rc.registry.lookup('31566704');
console.log("USDC Asset:", usdc);
const usdcFilter = new FilterFormBuilder()
    .keyFilter('31566704')
    .event(KeyEvent.AssetXfer)
    .stream(personalStream)
    //.amount(5, NumericCondition.GreaterOrEqual)  // Optionally set a minimum Xfer Amount
    .build();

//
// Create an Id-based filter for all Central Exchange Withdrawals
//
// A KeyIdentity is a pairing of (KeyGroup, KeyType)
// Note: Id Filters can be busier since they generally represent multiple Keys
//       Keep an eye on Match Usage: https://blockstalker.io/account
const cexFilter = new FilterFormBuilder()
    .idFilter(KeyGroup.CentralExchange, KeyType.Account)
    .event(KeyEvent.ExchangeWithdrawal)
    .stream(personalStream)
    .build();

// Create the filters
await rc.filters.create(usdcFilter);
await rc.filters.create(cexFilter);

// List all filters for stream
const filters = await rc.filters.getByStream(personalStream);
console.log("Personal stream filters:", filters);

/*
  ____ _____ ____  _____    _    __  __ ___ _   _  ____ 
 / ___|_   _|  _ \| ____|  / \  |  \/  |_ _| \ | |/ ___|
 \___ \ | | | |_) |  _|   / _ \ | |\/| || ||  \| | |  _ 
  ___) || | |  _ <| |___ / ___ \| |  | || || |\  | |_| |
 |____/ |_| |_| \_\_____/_/   \_\_|  |_|___|_| \_|\____|
*/

function handleEvent(event) {
    // Handle your streaming events here
    console.log(event);
}

const streamConnection = mainClient.streaming.events(handleEvent, [ personalStream ]);