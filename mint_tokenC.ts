import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from '@solana/spl-token';

// Function to create a new mint, mint tokens, and transfer them
const main = async () => {
  // Step 1: Establish a connection to Solana Devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Step 2: Generate a new wallet keypair or use an existing one
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        require('fs').readFileSync(
          require('os').homedir() + '/.config/solana/id.json',
          'utf8'
        )
      )
    )
  );

  console.log('Payer PublicKey:', payer.publicKey.toBase58());

  // Step 3: Create a new token mint
  const mintAuthority = payer; // The mint authority has the power to mint new tokens
  const freezeAuthority = payer; // Optional: Can set the freeze authority for the mint

  const mint = await createMint(
    connection,
    payer, // Fee payer
    mintAuthority.publicKey, // Mint authority
    freezeAuthority.publicKey, // Freeze authority (optional)
    9 // Number of decimals for the token (9 is the same as SOL)
  );

  console.log('Mint Address:', mint.toBase58());

  // Step 4: Create a token account to hold the newly minted tokens
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer, // Fee payer
    mint, // The mint (token) address
    payer.publicKey // Owner of the token account
  );

  console.log('Token Account:', tokenAccount.address.toBase58());

  // Step 5: Mint new tokens to the token account
  const amountToMint = 1000 * 10 ** 9; // 1000 tokens, with 9 decimal places
  await mintTo(
    connection,
    payer, // Fee payer
    mint, // The mint (token) address
    tokenAccount.address, // The token account to mint into
    mintAuthority, // The mint authority
    amountToMint // The amount of tokens to mint
  );

  console.log(`Minted ${amountToMint / 10 ** 9} tokens to ${tokenAccount.address.toBase58()}`);

  // Step 6: Optionally, transfer some tokens to another account
  // Generate a random receiver account for demo purposes
  const receiver = Keypair.generate();

  // Get or create the associated token account for the receiver
  const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    receiver.publicKey
  );

  console.log('Receiver Token Account:', receiverTokenAccount.address.toBase58());

  const transferAmount = 500 * 10 ** 9; // Transfer 500 tokens
  await transfer(
    connection,
    payer,
    tokenAccount.address,
    receiverTokenAccount.address,
    payer.publicKey, // Owner of the source account
    transferAmount
  );

  console.log(`Transferred ${transferAmount / 10 ** 9} tokens to ${receiverTokenAccount.address.toBase58()}`);
};

main().catch((err) => {
  console.error(err);
});
