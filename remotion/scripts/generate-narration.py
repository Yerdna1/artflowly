#!/usr/bin/env python3
"""Generate narration audio for ArtFlowly marketing video using edge-tts."""

import asyncio
import edge_tts
import os

EN_VOICE = "en-US-GuyNeural"
SK_VOICE = "sk-SK-LukasNeural"

NARRATION_EN = {
    "01-intro": (
        "Expensive. Slow. Complex. "
        "Traditional video production simply doesn't scale for modern businesses. "
        "Agencies charge premium rates. Timelines stretch into weeks and months. "
        "And coordinating crews, actors, and post-production is a logistics nightmare. "
        "But what if your team could produce studio-quality content in hours, not weeks?"
    ),
    "02-solution": (
        "Introducing ArtFlowly. The AI-powered video production platform built for business. "
        "ArtFlowly is an end-to-end solution that takes you from concept to finished video, "
        "all within a single platform. No agencies. No complex toolchains. No waiting. "
        "Just your team, your ideas, and the power of AI."
    ),
    "03-stats": (
        "The numbers speak for themselves. Over 590 videos produced. "
        "More than 7,400 scenes generated. And 160 business users who have already "
        "transformed how they create video content. "
        "This isn't a prototype. This is production-ready technology."
    ),
    "04-cost": (
        "Dramatically reduce your production costs. "
        "Companies using ArtFlowly report 30 to 60 percent savings across all video categories. "
        "Animated explainer videos? 55 percent less. Marketing and advertising content? 45 percent. "
        "Training and onboarding videos? Up to 60 percent savings. "
        "And voiceover and localization drops by half. "
        "With 17 AI image models and 15 video models, you get variety without the vendor lock-in. "
        "ArtFlowly scales as your business grows, and it's white-label ready for your brand."
    ),
    "05a-story": (
        "Step one. Story and Settings. "
        "Define your narrative, choose the visual style, and set the tone for your production. "
        "AI assists with story structuring, so your team can focus on creative direction "
        "rather than starting from a blank page. Configure presets and move fast."
    ),
    "05b-characters": (
        "Step two. Character Design. "
        "Describe your characters in plain text and watch AI generate professional portraits in seconds. "
        "Characters stay visually consistent across every scene. "
        "Assign voice profiles and build a cast your audience will remember."
    ),
    "05c-scenes": (
        "Step three. Scene Generation. "
        "AI writes production-ready scene descriptions, complete with dialogue and camera direction. "
        "Process ten scenes at a time with batch generation. "
        "Your team maintains full creative control to edit, reorder, and refine."
    ),
    "05d-images": (
        "Step four. Image Generation. "
        "Choose from over 17 AI models to find the perfect visual style for your project. "
        "Switch providers without re-prompting. Regenerate until every frame is exactly on-brand. "
        "Maintain visual consistency across your entire production."
    ),
    "05e-video": (
        "Step five. Video Generation. "
        "Bring your images to life with motion. 15 plus video generation models at your fingertips. "
        "Parallel processing means fast turnaround even for large-scale productions. "
        "Multiple duration and resolution options to fit any distribution channel."
    ),
    "05f-voiceover": (
        "Step six. Voiceover and Music. "
        "Complete your production with AI-generated dialogue in multiple languages. "
        "Add background music that fits the mood. "
        "Export your final video, ready for distribution. "
        "From concept to finished product, all in one platform."
    ),
    "06-features": (
        "ArtFlowly is built for business from the ground up. "
        "Role-based access control keeps your production team organized. "
        "Produce content in any language and reach global markets instantly. "
        "Deploy on your own infrastructure with self-hosted options. Your data stays yours. "
        "And with API integration, embed video generation directly into your existing workflows and products."
    ),
    "07-cta": (
        "Ready to transform your video production? "
        "Join leading businesses already producing with ArtFlowly. "
        "Reduce costs. Accelerate timelines. Scale your content output without scaling your team. "
        "Request a demo today at artflowly.com. "
        "ArtFlowly — where AI meets production."
    ),
}

NARRATION_SK = {
    "01-intro": (
        "Drahé. Pomalé. Zložité. "
        "Tradičná video produkcia sa jednoducho nedá škálovať pre moderné firmy. "
        "Agentúry účtujú prémiové ceny. Termíny sa naťahujú na týždne a mesiace. "
        "A koordinácia štábov, hercov a postprodukcie je logistická nočná mora. "
        "Čo keby váš tím vedel produkovať štúdiový obsah za hodiny, nie týždne?"
    ),
    "02-solution": (
        "Predstavujeme ArtFlowly. AI platforma pre video produkciu vytvorená pre biznis. "
        "ArtFlowly je kompletné riešenie, ktoré vás prevedie od konceptu po hotové video, "
        "všetko v jednej platforme. Žiadne agentúry. Žiadne zložité nástroje. Žiadne čakanie. "
        "Len váš tím, vaše nápady a sila umelej inteligencie."
    ),
    "03-stats": (
        "Čísla hovoria za všetko. Viac ako 590 vyprodukovaných videí. "
        "Viac ako 7 400 vygenerovaných scén. A 160 firemných používateľov, "
        "ktorí už transformovali spôsob, akým tvoria video obsah. "
        "Toto nie je prototyp. Toto je technológia pripravená na produkciu."
    ),
    "04-cost": (
        "Dramaticky znížte náklady na produkciu. "
        "Firmy používajúce ArtFlowly hlásia 30 až 60 percentné úspory vo všetkých kategóriách videa. "
        "Animované vysvetľovacie videá? O 55 percent menej. Marketingový obsah? 45 percent. "
        "Školiace a onboardingové videá? Až 60 percentné úspory. "
        "A dabing a lokalizácia klesne o polovicu. "
        "So 17 AI obrazovými modelmi a 15 video modelmi máte variabilitu bez závislosti na jednom dodávateľovi. "
        "ArtFlowly sa škáluje s rastom vášho biznisu a je pripravený na white-label pre vašu značku."
    ),
    "05a-story": (
        "Krok jedna. Príbeh a nastavenia. "
        "Definujte naratív, vyberte vizuálny štýl a nastavte tón vašej produkcie. "
        "AI pomáha so štrukturovaním príbehu, takže sa váš tím môže sústrediť na kreatívne vedenie "
        "namiesto začínania od nuly. Nakonfigurujte presety a pracujte rýchlo."
    ),
    "05b-characters": (
        "Krok dva. Dizajn postáv. "
        "Popíšte postavy bežným textom a sledujte, ako AI generuje profesionálne portréty za sekundy. "
        "Postavy zostávajú vizuálne konzistentné naprieč každou scénou. "
        "Priraďte hlasové profily a vytvorte obsadenie, ktoré si vaše publikum zapamätá."
    ),
    "05c-scenes": (
        "Krok tri. Generovanie scén. "
        "AI napíše produkčné popisy scén vrátane dialógov a réžie kamery. "
        "Spracujte desať scén naraz s dávkovým generovaním. "
        "Váš tím si zachováva plnú kreatívnu kontrolu na editáciu, zoradenie a vyladenie."
    ),
    "05d-images": (
        "Krok štyri. Generovanie obrázkov. "
        "Vyberte si z viac ako 17 AI modelov pre dokonalý vizuálny štýl vášho projektu. "
        "Zmeňte poskytovateľa bez prepísania promptov. Regenerujte, kým nebude každý záber presne on-brand. "
        "Udržiavajte vizuálnu konzistentnosť naprieč celou produkciou."
    ),
    "05e-video": (
        "Krok päť. Generovanie videa. "
        "Oživte obrázky pohybom. 15 a viac modelov na generovanie videa na dosah ruky. "
        "Paralelné spracovanie znamená rýchly výstup aj pre veľké produkcie. "
        "Viaceré možnosti trvania a rozlíšenia pre akýkoľvek distribučný kanál."
    ),
    "05f-voiceover": (
        "Krok šesť. Hlas a hudba. "
        "Dokončite produkciu s AI generovanými dialógmi vo viacerých jazykoch. "
        "Pridajte hudbu na pozadí, ktorá ladí s náladou. "
        "Exportujte finálne video pripravené na distribúciu. "
        "Od konceptu po hotový produkt, všetko v jednej platforme."
    ),
    "06-features": (
        "ArtFlowly je od základu vytvorený pre biznis. "
        "Prístup podľa rolí udržiava váš produkčný tím organizovaný. "
        "Produkujte obsah v akomkoľvek jazyku a oslovte globálne trhy okamžite. "
        "Nasaďte na vlastnej infraštruktúre so self-hosted možnosťami. Vaše dáta zostávajú vaše. "
        "A s API integráciou zabudujte generovanie videa priamo do vašich existujúcich procesov a produktov."
    ),
    "07-cta": (
        "Pripravení transformovať vašu video produkciu? "
        "Pridajte sa k firmám, ktoré už produkujú s ArtFlowly. "
        "Znížte náklady. Zrýchlite termíny. Škálujte produkciu obsahu bez rozširovania tímu. "
        "Dohodnite si demo ešte dnes na artflowly.com. "
        "ArtFlowly — kde sa AI stretáva s produkciou."
    ),
}

async def generate_audio(text: str, voice: str, output_path: str):
    """Generate a single audio file."""
    communicate = edge_tts.Communicate(text, voice, rate="-5%")
    await communicate.save(output_path)
    print(f"  Generated: {output_path}")

async def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    en_dir = os.path.join(base_dir, "public", "audio", "en")
    sk_dir = os.path.join(base_dir, "public", "audio", "sk")

    os.makedirs(en_dir, exist_ok=True)
    os.makedirs(sk_dir, exist_ok=True)

    print("Generating English narration...")
    for key, text in NARRATION_EN.items():
        await generate_audio(text, EN_VOICE, os.path.join(en_dir, f"{key}.mp3"))

    print("\nGenerating Slovak narration...")
    for key, text in NARRATION_SK.items():
        await generate_audio(text, SK_VOICE, os.path.join(sk_dir, f"{key}.mp3"))

    print("\nDone! All narration files generated.")

if __name__ == "__main__":
    asyncio.run(main())
