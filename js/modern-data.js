/**
 * Modern History Timeline Data (Offline Fallback & Local Storage)
 * Spectrum's Modern History of India (1707 - 1947)
 */

const modernTimelineData = {
  "title": {
    "media": {
      "url": "https://youtu.be/zN8pjeLSzUc?si=vrna3RgLlKf3kka3",
      "credit": "StudyIAS"
    },
    "text": {
      "headline": "Modern History (1707 – 1947)",
      "text": "<p>Spectrum’s Modern History covers the history of India from the decline of the Mughal Empire to Independence (1707 to 1947).</p><p><em>Reading notes, key leaders, and pivotal national movements.</em></p>"
    }
  },
  "events": [
    {
      "id": "evt_1707_aurangzeb",
      "display_date": "03 Mar 1707",
      "start_date": {
        "year": "1707",
        "month": "3",
        "day": "3"
      },
      "text": {
        "headline": "Death of Aurangzeb & Decline of Mughals",
        "text": "<p>The death of Mughal Emperor Aurangzeb at Ahmednagar marked the end of the centralized imperial era. Succession wars and the rise of autonomous regional kingdoms (Marathas, Nawabs of Bengal, Awadh, and Nizam of Hyderabad) created a political vacuum swiftly exploited by European mercantilist powers.</p>\n<div class=\"book-citation\"><strong>Spectrum Chapter 3:</strong> Expansion & Consolidation of British Power in India</div>"
      },
      "group": "Company Rule",
      "media": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Aurangzeb_in_later_years.jpg/800px-Aurangzeb_in_later_years.jpg",
        "credit": "Wikimedia Commons",
        "caption": "Emperor Aurangzeb reading in his later years"
      },
      "background": {
        "color": "#1f1d1a"
      }
    },
    {
      "id": "evt_1757_plassey",
      "display_date": "23 Jun 1757",
      "start_date": {
        "year": "1757",
        "month": "6",
        "day": "23"
      },
      "text": {
        "headline": "Battle of Plassey",
        "text": "<p>British forces under Robert Clive defeated Siraj-ud-Daulah, the Nawab of Bengal, following the betrayal of commander Mir Jafar. This decisive battle laid the territorial foundation of the British East India Company's rule in India, transforming it from a trading company into a dominant sovereign authority.</p>\n<div class=\"book-citation\"><strong>Spectrum Chapter 4:</strong> Rise of the British Power in Bengal</div>"
      },
      "group": "Company Rule",
      "media": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lord_Clive_meeting_with_Mir_Jafar_after_the_Battle_of_Plassey.jpg/1280px-Lord_Clive_meeting_with_Mir_Jafar_after_the_Battle_of_Plassey.jpg",
        "credit": "Francis Hayman / National Portrait Gallery",
        "caption": "Robert Clive meeting Mir Jafar after Plassey (1757)"
      },
      "background": {
        "color": "#231f17"
      }
    },
    {
      "id": "evt_1764_buxar",
      "display_date": "22 Oct 1764",
      "start_date": {
        "year": "1764",
        "month": "10",
        "day": "22"
      },
      "text": {
        "headline": "Battle of Buxar & Diwani Rights",
        "text": "<p>The combined forces of Mir Qasim (Nawab of Bengal), Shuja-ud-Daula (Nawab of Awadh), and Mughal Emperor Shah Alam II were decisively defeated by Hector Munro at Buxar. Through the subsequent Treaty of Allahabad (1765), Clive acquired the <em>Diwani</em> (fiscal administration and revenue collection rights) over Bengal, Bihar, and Orissa.</p>\n<div class=\"book-citation\"><strong>Spectrum Chapter 4:</strong> Dual Government in Bengal (1765–1772)</div>"
      },
      "group": "Company Rule",
      "media": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Shah_%27Alam_conveying_the_grant_of_the_Diwani_to_Lord_Clive%2C_August_1765.jpg/1280px-Shah_%27Alam_conveying_the_grant_of_the_Diwani_to_Lord_Clive%2C_August_1765.jpg",
        "credit": "Benjamin West / British Library",
        "caption": "Shah Alam II granting the Diwani of Bengal to Lord Clive (August 1765)"
      },
      "background": {
        "color": "#1c221a"
      }
    },
    {
      "id": "evt_1773_regulating_act",
      "display_date": "1773",
      "start_date": {
        "year": "1773"
      },
      "text": {
        "headline": "The Regulating Act of 1773",
        "text": "<p>The British Parliament passed its first major statute to regulate the administration of the East India Company. Warren Hastings was appointed the first Governor-General of Bengal, subordinating Madras and Bombay presidencies, and establishing the Supreme Court of Judicature at Calcutta (1774).</p>\n<div class=\"book-citation\"><strong>Spectrum Chapter 26:</strong> Constitutional Development under British Rule</div>"
      },
      "group": "Administration",
      "background": {
        "color": "#181f28"
      }
    },
    {
      "id": "evt_1857_revolt",
      "display_date": "10 May 1857",
      "start_date": {
        "year": "1857",
        "month": "5",
        "day": "10"
      },
      "text": {
        "headline": "The Revolt of 1857 (First War of Independence)",
        "text": "<p>Triggered by sepoy resentment at Meerut over greased cartridges and underlying colonial grievances, the rebellion spread across Northern and Central India under the nominal leadership of Mughal Emperor Bahadur Shah Zafar. The revolt ended the reign of the East India Company and led directly to Queen Victoria's Proclamation of 1858 transferring power to the British Crown.</p>\n<div class=\"book-citation\"><strong>Spectrum Chapter 7:</strong> The Revolt of 1857</div>"
      },
      "group": "Revolt & Resistance",
      "media": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Capture_of_Bahadur_Shah_Zafar.jpg/1280px-Capture_of_Bahadur_Shah_Zafar.jpg",
        "credit": "Wikimedia Commons",
        "caption": "Capture of Bahadur Shah Zafar by Major Hodson in Delhi (1857)"
      },
      "background": {
        "color": "#2c1717"
      }
    },
    {
      "id": "evt_0_1869",
      "display_date": "02 Oct 1869 – 30 Jan 1948",
      "start_date": {
        "year": "1869",
        "month": "10",
        "day": "2"
      },
      "text": {
        "headline": "Mahatma Gandhi",
        "text": "<p>Mohandas Karamchand Gandhi was an Indian lawyer, anti-colonial nationalist, and political ethicist who employed nonviolent resistance to lead the successful campaign for India's independence from British rule, and whose legacy would later inspire movements for civil rights and freedom across the world.</p>\n<div class=\"book-citation\"><strong>Book Note:</strong> Spectrum's Modern India</div>"
      },
      "end_date": {
        "year": "1948"
      },
      "group": "Gandhi",
      "media": {
        "url": "https://youtu.be/codWemzsW40?si=6F3PDaZoeCZsHuv6"
      },
      "background": {
        "color": "#409c5b"
      }
    },
    {
      "id": "evt_1793266634084",
      "display_date": "25 Dec 1876 – 11 Sep 1948",
      "start_date": {
        "year": "1876",
        "month": "12",
        "day": "25"
      },
      "text": {
        "headline": "Muhammad Ali Jinnah",
        "text": "<p>Muhammad Ali Jinnah was born into a Muslim family rather than being a convert himself, though his ancestral roots trace back to a Hindu background. His paternal grandfather, Premjibhai Meghji Thakkar, belonged to a prosperous Hindu Lohana family from Paneli Moti village in Gujarat. After entering the fish and non-vegetarian trade, Premjibhai was socially excommunicated by his orthodox community, which ultimately led him to convert to the Ismaili Khoja branch of Islam. His son, Jinnahbhai Poonja (Jinnah's father), was raised as a Muslim and migrated to Karachi, where Jinnah was born in 1876. While Jinnah grew up within the Ismaili Khoja tradition, he later adopted mainstream Twelver Shia or Sunni traditions during his adult and political life.</p>\n<div class=\"book-citation\"><strong>Book Note:</strong> Spectrum's Modern India</div>"
      },
      "end_date": {
        "year": "1948"
      },
      "group": "Jannah",
      "media": {
        "url": "https://youtu.be/_RmMGNseS9U",
        "caption": "BBC"
      },
      "background": {
        "color": "#022c22"
      }
    },
    {
      "start_date": {
        "year": "1889",
        "month": "11",
        "day": "14"
      },
      "display_date": "14 Nov 1889 – 27 May 1964",
      "end_date": {
        "year": "1964",
        "month": "5",
        "day": "27"
      },
      "text": {
        "headline": "Jawahar lal Nehru",
        "text": "<p>Jawaharlal Nehru was an Indian lawyer, anti-colonial nationalist, secular humanist, social democrat, and statesman who was a central figure in India during the middle of the 20th century. Nehru was a principal leader of the Indian nationalist movement in the 1930s and 1940s.</p>"
      },
      "group": "Nehru",
      "id": "evt_1_1889"
    },
    {
      "start_date": {
        "year": "1897",
        "month": "1",
        "day": "23"
      },
      "display_date": "23 Jan 1897 – 18 Aug 1945",
      "end_date": {
        "year": "1945",
        "month": "8",
        "day": "18"
      },
      "text": {
        "headline": "Subhash Chandra Bose",
        "text": "<p>Subhas Chandra Bose was an Indian anti-colonial nationalist whose defiance of British authority in India made him a hero among many Indians, but his wartime alliances with Nazi Germany and the Empire of Japan left a legacy vexed by authoritarianism, antisemitism, and military failure.</p>"
      },
      "media": {
        "url": "https://shwetankspad.com/wp-content/uploads/2015/01/bose.jpg?w=1440",
        "credit": "Wiki"
      },
      "group": "Bose",
      "id": "evt_2_1897"
    },
    {
      "start_date": {
        "year": "1919",
        "month": "4",
        "day": "13"
      },
      "display_date": "13 Apr 1919",
      "text": {
        "headline": "Jallianwala Bagh massacre",
        "text": "<p>Jallianwala Bagh is a historic garden and memorial of national importance close to the Golden Temple complex in Amritsar, Punjab, India, preserved in the memory of those wounded and killed in the Jallianwala Bagh Massacre that took place on the site on the festival of Baisakhi Day.</p>"
      },
      "media": {
        "url": "https://youtu.be/twxfswoZhFM?si=JiyZVSEch1diosCz",
        "credit": "YouTube"
      },
      "id": "evt_3_1919"
    }
  ],
  "eras": [
    {
      "start_date": {
        "year": "1707"
      },
      "end_date": {
        "year": "1857"
      },
      "text": {
        "headline": "Decline of Mughals & Company Rule (1707–1857)",
        "text": "<p>Decline of the Mughal Empire, rise of regional kingdoms, expansion of the British East India Company, and the Great Revolt of 1857.</p>"
      }
    },
    {
      "start_date": {
        "year": "1858"
      },
      "end_date": {
        "year": "1918"
      },
      "text": {
        "headline": "Direct Crown Rule & Early Nationalism (1858–1918)",
        "text": "<p>Queen Victoria's Proclamation of 1858, modern English education, Indian National Congress (1885), Partition of Bengal (1905), and Swadeshi Movement.</p>"
      }
    },
    {
      "start_date": {
        "year": "1919"
      },
      "end_date": {
        "year": "1947"
      },
      "text": {
        "headline": "Gandhian Era & Road to Freedom (1919–1947)",
        "text": "<p>Mass mobilization, Rowlatt Satyagraha, Non-Cooperation Movement, Civil Disobedience Movement, Quit India, and Independence.</p>"
      }
    }
  ]
};
