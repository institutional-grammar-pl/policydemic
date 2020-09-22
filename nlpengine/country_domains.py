country_domains = {'af': 'Afghanistan', 'ax': 'Aland', 'al': 'Albania', 'dz': 'Algeria', 'as': 'American Samoa',
                   'ad': 'Andorra', 'ao': 'Angola', 'ai': 'Anguilla', 'aq': 'Antarctica', 'ag': 'Antigua and Barbuda',
                   'ar': 'Argentina', 'am': 'Armenia', 'aw': 'Aruba', 'ac': 'Ascension Island', 'au': 'Australia',
                   'at': 'Austria', 'az': 'Azerbaijan', 'bs': 'Bahamas', 'bh': 'Bahrain', 'bd': 'Bangladesh',
                   'bb': 'Barbados', 'eus': 'Basque Country', 'by': 'Belarus', 'be': 'Belgium', 'bz': 'Belize',
                   'bj': 'Benin', 'bm': 'Bermuda', 'bt': 'Bhutan', 'bo': 'Bolivia', 'bq': 'Sint Eustatius',
                   'ba': 'Bosnia and Herzegovina', 'bw': 'Botswana', 'bv': 'Bouvet Island', 'br': 'Brazil',
                   'io': 'British Indian Ocean Territory', 'vg': 'British Virgin Islands', 'bn': 'Brunei',
                   'bg': 'Bulgaria', 'bf': 'Burkina Faso', 'bi': 'Burundi', 'kh': 'Cambodia', 'cm': 'Cameroon',
                   'ca': 'Canada', 'cat': 'Catalonia', 'ky': 'Cayman Islands', 'cf': 'Central African Republic',
                   'td': 'Chad', 'cl': 'Chile', 'cn': "China, People's Republic of", 'cx': 'Christmas Island',
                   'cc': 'Cocos ', 'co': 'Colombia', 'km': 'Comoros', 'ck': 'Cook Islands', 'cr': 'Costa Rica',
                   'hr': 'Croatia', 'cu': 'Cuba', 'cy': 'Cyprus', 'dk': 'Denmark', 'dj': 'Djibouti', 'dm': 'Dominica',
                   'do': 'Dominican Republic', 'ec': 'Ecuador', 'eg': 'Egypt', 'sv': 'El Salvador', 'uk': 'Wales',
                   'gq': 'Equatorial Guinea', 'er': 'Eritrea', 'ee': 'Estonia', 'et': 'Ethiopia',
                   'eu': 'European Union', 'fo': 'Faeroe Islands', 'fk': 'Falkland Islands', 'fj': 'Fiji',
                   'fi': 'Finland', 'fr': 'France', 'tf': 'French Southern and Antarctic Lands', 'gal': 'Galicia',
                   'gm': 'Gambia', 'ge': 'Georgia', 'de': 'Germany', 'gh': 'Ghana', 'gi': 'Gibraltar', 'gr': 'Greece',
                   'gl': 'Greenland', 'gd': 'Grenada', 'gu': 'Guam', 'gt': 'Guatemala', 'gg': 'Guernsey',
                   'gn': 'Guinea', 'gw': 'Guinea-Bissau', 'gy': 'Guyana', 'ht': 'Haiti', 'hn': 'Honduras',
                   'hk': 'Hong Kong', 'hu': 'Hungary', 'is': 'Iceland', 'in': 'India', 'id': 'Indonesia', 'ir': 'Iran',
                   'iq': 'Iraq', 'ie': 'Ireland', 'im': 'Isle of Man', 'il': 'Israel', 'it': 'Italy', 'jm': 'Jamaica',
                   'jp': 'Japan', 'je': 'Jersey', 'jo': 'Jordan', 'kz': 'Kazakhstan', 'ke': 'Kenya', 'ki': 'Kiribati',
                   'kp': 'North Korea', 'kr': 'South Korea', 'ot': 'Kosovo', 'kw': 'Kuwait', 'kg': 'Kyrgyzstan',
                   'la': 'Laos', 'lv': 'Latvia', 'lb': 'Lebanon', 'ls': 'Lesotho', 'lr': 'Liberia', 'ly': 'Libya',
                   'li': 'Liechtenstein', 'lt': 'Lithuania', 'lu': 'Luxembourg', 'mo': 'Macau', 'mk': 'North Macedonia',
                   'mg': 'Madagascar', 'mw': 'Malawi', 'my': 'Malaysia', 'mv': 'Maldives', 'ml': 'Mali', 'mt': 'Malta',
                   'mh': 'Marshall Islands', 'mr': 'Mauritania', 'mu': 'Mauritius', 'mx': 'Mexico', 'md': 'Moldova',
                   'mc': 'Monaco', 'mn': 'Mongolia', 'me': 'Montenegro', 'ms': 'Montserrat', 'ma': 'Morocco',
                   'mz': 'Mozambique', 'mm': 'Myanmar', 'na': 'Namibia', 'nr': 'Nauru', 'np': 'Nepal',
                   'nl': 'Netherlands', 'nz': 'New Zealand', 'ni': 'Nicaragua', 'ne': 'Niger', 'ng': 'Nigeria',
                   'nu': 'Niue', 'nf': 'Norfolk Island', 'mp': 'Northern Mariana Islands', 'no': 'Norway', 'om': 'Oman',
                   'pk': 'Pakistan', 'pw': 'Palau', 'ps': 'West Bank', 'pa': 'Panama', 'pg': 'Papua New Guinea',
                   'py': 'Paraguay', 'pe': 'Peru', 'ph': 'Philippines', 'pn': 'Pitcairn Islands', 'pl': 'Poland',
                   'pt': 'Portugal', 'pr': 'Puerto Rico', 'qa': 'Qatar', 'ro': 'Romania', 'ru': 'Russia',
                   'rw': 'Rwanda', 'sh': 'Saint Helena', 'kn': 'Saint Kitts and Nevis', 'lc': 'Saint Lucia',
                   'vc': 'Saint Vincent and the Grenadines', 'ws': 'Samoa', 'sm': 'San Marino', 'sa': 'Saudi Arabia',
                   'sn': 'Senegal', 'rs': 'Serbia', 'sc': 'Seychelles', 'sl': 'Sierra Leone', 'sg': 'Singapore',
                   'sx': 'Sint Maarten', 'sk': 'Slovakia', 'si': 'Slovenia', 'sb': 'Solomon Islands', 'so': 'Somalia',
                   'za': 'South Africa', 'gs': 'South Georgia and the South Sandwich Islands', 'ss': 'South Sudan',
                   'es': 'Spain', 'lk': 'Sri Lanka', 'sd': 'Sudan', 'sr': 'Suriname',
                   'sj': 'Svalbard and Jan Mayen Islands', 'sz': 'Swaziland', 'se': 'Sweden', 'ch': 'Switzerland',
                   'sy': 'Syria', 'tw': 'Taiwan', 'tj': 'Tajikistan', 'tz': 'Tanzania', 'th': 'Thailand', 'tg': 'Togo',
                   'tk': 'Tokelau', 'to': 'Tonga', 'tt': 'Trinidad and Tobago', 'tn': 'Tunisia', 'tr': 'Turkey',
                   'tm': 'Turkmenistan', 'tc': 'Turks and Caicos Islands', 'tv': 'Tuvalu', 'ug': 'Uganda',
                   'ua': 'Ukraine', 'ae': 'United Arab Emirates ', 'us': 'United States of America ',
                   'vi': 'United States Virgin Islands', 'uy': 'Uruguay', 'uz': 'Uzbekistan', 'vu': 'Vanuatu',
                   'va': 'Vatican City', 've': 'Venezuela', 'vn': 'Vietnam', 'eh': 'Western Sahara', 'ye': 'Yemen',
                   'zm': 'Zambia', 'zw': 'Zimbabwe'}
