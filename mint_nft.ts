import { Keypair, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import {  irysStorage, keypairIdentity, Metaplex, Nft } from '@metaplex-foundation/js';
import fs from 'fs';
import os from 'os';
//import pqt3a from '../mint/pqt3.png'
//import { bundlrStorage } from "@metaplex-foundation/js";



// Function to mint an NFT
const mintNFT = async () => {
  // Step 1: Establish a connection to Solana Devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Step 2: Load the wallet keypair from the Solana CLI configuration
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8')
      )
    )
  );

  // Step 3: Initialize Metaplex with the connection and identity
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
        irysStorage({
        address: 'https://devnet.irys.xyz',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
      })
    );

  // Step 4: Upload the metadata and image for the NFT (example image path)
 // const imageFile = fs.readFileSync('/');
//   const { uri: imageUri } = await metaplex.storage().upload({
//     buffer: imageFile,
//     fileName: 'nft-image.png',
//     contentType: 'image/png',
//   });

  // Step 5: Upload NFT metadata (including the image URI)
  const { uri: metadataUri } = await metaplex.nfts().uploadMetadata({
    name: 'My First NFT',
    symbol: 'NFT',
    description: 'This is my first NFT on Solana!',
    image: "imageUri",
  });

  console.log('NFT Metadata URI:', metadataUri);

  // Step 6: Create and mint the NFT
  const { nft } = await metaplex.nfts().create({
    uri: metadataUri,
    name: 'My First NFT',
    sellerFeeBasisPoints: 500, // 5% royalty fee
    symbol: 'NFT',
    maxSupply: 1, // 1 means this NFT is not re-mintable (1 of 1)
  });

  console.log(`NFT minted with address: ${nft.address.toBase58()}`);
};

mintNFT().catch(console.error);
