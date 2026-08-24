/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Os formulários de anúncio (Mercado da Terra e Gran Bazar) enviam as
      // imagens como File dentro do FormData diretamente para o server
      // action (createBazarAd/updateBazarAd, etc.), sem passar por upload
      // separado. O limite por omissão do Next (1MB) rejeita isto assim que
      // há pelo menos uma foto real anexada — <ImageUpload maxFiles={5}
      // maxSizeMB={5}> permite até 5 imagens de 5MB cada, por isso o limite
      // tem de cobrir esse caso (com alguma margem para o overhead do
      // multipart/form-data). Se estes valores de maxFiles/maxSizeMB forem
      // alterados no futuro, rever este limite também.
      bodySizeLimit: "15mb",
    },
  },
};

module.exports = nextConfig;
