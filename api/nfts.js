import express from "express";
import cors from "cors";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";

const app = express();
app.use(cors());

const connection = new Connection(clusterApiUrl("mainnet-beta"));
const metaplex = Metaplex.make(connection).use(bundlrStorage());

const CREATOR = "EG1x6cDjwNCqH4GxkTNvzGFpndgvRYLQmxot3gRDKwX6";

app.get("/api/nfts", async (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.status(400).send("Missing wallet address");

  try {
    const owner = new PublicKey(wallet);
    const allNFTs = await metaplex.nfts().findAllByOwner({ owner });

    const filtered = allNFTs.filter(n =>
      n.creators?.some(c => c.address.toBase58() === CREATOR)
    );

    const withMetadata = await Promise.all(
      filtered.map(async nft => {
        const full = await metaplex.nfts().load({ metadata: nft });
        return {
          name: full.name,
          image: full.json?.image,
          description: full.json?.description,
        };
      })
    );

    res.json(withMetadata);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching NFTs");
  }
});

export default app;
