/**
 * Modern History Timeline Data (Offline Fallback & Local Cache)
 * Spectrum's Modern History of India (1707 - 1947)
 */

const modernTimelineData = {
  title: {
    media: {
      url: "https://youtu.be/zN8pjeLSzUc?si=vrna3RgLlKf3kka3",
      credit: "StudyIAS"
    },
    text: {
      headline: "Modern History (1707 – 1947)",
      text: "<p>Spectrum’s Modern History covers the history of India from the decline of the Mughal Empire to Independence (1707 to 1947).</p><p><em>Reading notes, key leaders, and pivotal national movements.</em></p>"
    }
  },
  events: [
    {
      start_date: { year: "1869", month: "10", day: "2" },
      end_date: { year: "1948", month: "1", day: "30" },
      text: {
        headline: "Mahatma Gandhi",
        text: `<p>Mohandas Karamchand Gandhi was an Indian lawyer, anti-colonial nationalist, and political ethicist who employed nonviolent resistance to lead the successful campaign for India's independence from British rule, and whose legacy would later inspire movements for civil rights and freedom across the world.</p>`
      },
      media: {
        url: "https://youtu.be/codWemzsW40?si=6F3PDaZoeCZsHuv6"
      },
      group: "Gandhi"
    },
    {
      start_date: { year: "1889", month: "11", day: "14" },
      end_date: { year: "1964", month: "5", day: "27" },
      text: {
        headline: "Jawahar lal Nehru",
        text: `<p>Jawaharlal Nehru was an Indian lawyer, anti-colonial nationalist, secular humanist, social democrat, and statesman who was a central figure in India during the middle of the 20th century. Nehru was a principal leader of the Indian nationalist movement in the 1930s and 1940s.</p>`
      },
      group: "Nehru"
    },
    {
      start_date: { year: "1897", month: "1", day: "23" },
      end_date: { year: "1945", month: "8", day: "18" },
      text: {
        headline: "Subhash Chandra Bose",
        text: `<p>Subhas Chandra Bose was an Indian anti-colonial nationalist whose defiance of British authority in India made him a hero among many Indians, but his wartime alliances with Nazi Germany and the Empire of Japan left a legacy vexed by authoritarianism, antisemitism, and military failure.</p>`
      },
      media: {
        url: "https://shwetankspad.com/wp-content/uploads/2015/01/bose.jpg?w=1440",
        credit: "Wiki"
      },
      group: "Bose"
    },
    {
      start_date: { year: "1919", month: "4", day: "13" },
      text: {
        headline: "Jallianwala Bagh massacre",
        text: `<p>Jallianwala Bagh is a historic garden and memorial of national importance close to the Golden Temple complex in Amritsar, Punjab, India, preserved in the memory of those wounded and killed in the Jallianwala Bagh Massacre that took place on the site on the festival of Baisakhi Day.</p>`
      },
      media: {
        url: "https://youtu.be/twxfswoZhFM?si=JiyZVSEch1diosCz",
        credit: "YouTube"
      }
    }
  ]
};
