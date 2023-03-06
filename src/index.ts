import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  findMetadataPda,
} from "@metaplex-foundation/js"
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata"
import * as fs from "fs"

async function createNewMint(
  connection:web3.Connection,
  payer:web3.Keypair,
  mintAuthority:web3.PublicKey,
  freezeAuthority:web3.PublicKey,
  decimals:number

) {

  const tokenMint = await token.createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals
  )

  console.log(`The token mint account has been created at address ${tokenMint}`)
  console.log(
    `The Mint : https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
  )

  return tokenMint
}



async function createTokenAccount(
  connection:web3.Connection,
  payer:web3.Keypair,
  mint:web3.PublicKey,
  owner:web3.PublicKey,

){
  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  )

      console.log(
        `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
    )

    return tokenAccount

}


async function mintTokens(
  connection:web3.Connection,
  payer:web3.Keypair,
  mint:web3.PublicKey,
  destination:web3.PublicKey,
  authority:web3.Keypair,
  amount:number
) {
  const mintInfo = await token.getMint(connection, mint)
  const transactionSignature = await token.mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals
  )

    console.log(
    `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}


async function transferTokens(
  connection:web3.Connection,
  payer:web3.Keypair,
  source:web3.PublicKey,
  destination:web3.PublicKey,
  owner:web3.PublicKey,
  amount:number,
  mint:web3.PublicKey
) {
  const mintInfo = await token.getMint(connection, mint)

  const transactionSignature = await token.transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount *10 ** mintInfo.decimals
  )

  console.log(`Transfer Token https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`)
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)
  

  console.log("PublicKey:", user.publicKey.toBase58())

    const mint = await createNewMint(
    connection,
    user,           // We'll pay the fees
    user.publicKey, // We're the mint authority
    user.publicKey, // And the freeze authority >:)
    2               // Only two decimals!
  )

    const tokenAccount = await createTokenAccount(
    connection,     
    user,           
    mint,            
    user.publicKey   // Associating our address with the token account
  )
  console.log(`Address is ${tokenAccount.address}`)
  if (tokenAccount.address) {
    await mintTokens(connection, user, mint, tokenAccount.address, user, 100)
   
    const receiver =new  web3.PublicKey('9QPLuyNKLRdux8Ce5UFpF2xq7fd8Bnb6mfWKkVdCrqsk')
    
    const receiverTokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        receiver
    )
    if (receiverTokenAccount.address){

    await transferTokens(
        connection,
        user,
        tokenAccount.address,
        receiverTokenAccount.address,
        user.publicKey,
        50,
        mint
    )
  }
}
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
