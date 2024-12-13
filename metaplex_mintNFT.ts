import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from '@solana/spl-token';

import { createProgrammableNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  generateSigner,
  percentAmount,
  signerIdentity,
  keypairIdentity,
  keypairPayer,
  createSignerFromKeypair,
  sol,
  
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
//import fs from "fs";
import path from "path";

import * as fs from 'fs'
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { metaplex } from '@metaplex/js/lib/programs';


// Function to create a new mint, mint tokens, and transfer them
const main = async () => {
  console.log('Payer PublicKey:');
  createNft();
};



const createNft = async () => {
  //
  // ** Setting Up Umi **
  //


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

  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplTokenMetadata())
  .use(
    irysUploader({
      // mainnet address: "https://node1.irys.xyz"
      // devnet address: "https://devnet.irys.xyz"
      address: "https://devnet.irys.xyz",
    })
  );


  const myKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(
    JSON.parse(
      require('fs').readFileSync(
        require('os').homedir() + '/.config/solana/id.json',
        'utf8'
      )
    )
  ));

  const myKeypairSigner = createSignerFromKeypair(umi, myKeypair);

  umi.use(keypairIdentity(myKeypairSigner));


  // Airdrop 1 SOL to the identity
  // if you end up with a 429 too many requests error, you may have to use
  // the filesystem wallet method or change rpcs.
  console.log("Airdropping 1 SOL to identity");
 
  //await umi.rpc.airdrop(umi.identity.publicKey, sol(1));

  //
  // ** Upload an image to Arweave **
  //

  // use `fs` to read file via a string path.
  // You will need to understand the concept of pathing from a computing perspective.


  //const imageFile = await readFile('../asset/0.png');

//   const __filename = fileURLToPath(import.meta.dirname);
// const __dirname = dirname(__filename);
 
// const imageFile = fs.readFileSync(
//     path.join(__dirname, "../asset/0.png")
//   );

  let  imageFile = fs.readFileSync(
    path.join(__dirname, "images/pqt3.png")
  );

  //const logo =  require("../../assets/logo.png")

 //let imageFile =  logo
 //let imageFile = null
  // Use `createGenericFile` to transform the file into a `GenericFile` type
  // that umi can understand. Make sure you set the mimi tag type correctly
  // otherwise Arweave will not know how to display your image.

  const umiImageFile = createGenericFile(imageFile, "pqt3.png", {
    tags: [{ name: "Content-Type", value: "image/png" }],
  });

  // Here we upload the image to Arweave via Irys and we get returned a uri
  // address where the file is located. You can log this out but as the
  // uploader can takes an array of files it also returns an array of uris.
  // To get the uri we want we can call index [0] in the array.

//  console.log("Uploading image...");
  // const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) => {
  //   throw new Error(err);
  // });
  // console.log(imageUri);


  //
  // ** Upload Metadata to Arweave **
  //

  //const imageUri2 = await metaplex.storage().upload(file)

  const metadata = {
    name: "My Nft",
    description: "This is an Nft on Solana",
    image: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/SpongeBob_SquarePants_character.svg/640px-SpongeBob_SquarePants_character.svg.png",
    external_url: "https://example.com",
    attributes: [
      {
        trait_type: "trait1",
        value: "value1",
      },
      {
        trait_type: "trait2",
        value: "value2",
      },
    ],
    properties: {
      files: [
        {
          uri: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/SpongeBob_SquarePants_character.svg/640px-SpongeBob_SquarePants_character.svg.png",
          type: "image/png",
        },
      ],
      category: "image",
    },
  };

  // Call upon umi's uploadJson function to upload our metadata to Arweave via Irys.
  //console.log("Uploading metadata...");
  // const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
  //   throw new Error(err);
  // });

  //
  // ** Creating the Nft **
  //

  // We generate a signer for the Nft
  const nftSigner = generateSigner(umi);

  // Decide on a ruleset for the Nft.
  // Metaplex ruleset - publicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9")
  // Compatability ruleset - publicKey("AdH2Utn6Fus15ZhtenW4hZBQnvtLgM1YCW2MfVp7pYS5")
  const ruleset = null // or set a publicKey from above

  console.log("Creating Nft...");
  const tx = await createProgrammableNft(umi, {
    mint: nftSigner,
    sellerFeeBasisPoints: percentAmount(5.5),
    name: metadata.name,
    uri: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/SpongeBob_SquarePants_character.svg/640px-SpongeBob_SquarePants_character.svg.png",
    ruleSet: ruleset,
  }).sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];

  // Log out the signature and the links to the transaction and the NFT.
  console.log("\npNFT Created")
  console.log("View Transaction on Solana Explorer");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log("\n");
  console.log("View NFT on Metaplex Explorer");
  console.log(`https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`);
}



main().catch((err) => {
  console.error(err);
});
