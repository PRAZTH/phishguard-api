import re
from urllib.parse import urlparse
import tldextract

class FeatureExtractor:
    def __init__(self, url):
        self.url = url
        self.parsed_url = urlparse(url)

    def run(self):
        # This function calls all the individual checks and returns a list of results
        return [
            self.using_ip(),
            self.long_url(),
            self.short_url(),
            self.symbol_at(),
            self.redirecting(),
            self.prefix_suffix(),
            self.sub_domains(),
            self.https_token()
        ]

    def using_ip(self):
        # Checks if an IP address is used instead of a domain name
        match = re.search(
            '(([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\/)|'
            '((0x[0-9a-fA-F]{1,2})\\.(0x[0-9a-fA-F]{1,2})\\.(0x[0-9a-fA-F]{1,2})\\.(0x[0-9a-fA-F]{1,2})\\/)'
            '(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}', self.url)
        return 1 if match else 0

    def long_url(self):
        # Checks if the URL is suspiciously long
        if len(self.url) < 54:
            return 0
        elif len(self.url) >= 54 and len(self.url) <= 75:
            return 1
        return 2

    def short_url(self):
        # Checks if a URL shortening service is used (e.g., bit.ly)
        match = re.search('bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|is\.gd|cli\.gs|'
                          'yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|twurl\.nl|snipurl\.com|'
                          'short\.to|BudURL\.com|ping\.fm|post\.ly|Just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|'
                          'doiop\.com|short\.ie|kl\.am|wp\.me|rubyurl\.com|om\.ly|to\.ly|bit\.do|t\.co|lnkd\.in|'
                          'db\.tt|qr\.ae|adf\.ly|goo\.gl|bitly\.com|cur\.lv|tinyurl\.com|ow\.ly|bit\.ly|ity\.im|'
                          'q\.gs|is\.gd|po\.st|bc\.vc|twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org',
                          self.url)
        return 1 if match else 0

    def symbol_at(self):
        # Checks for the "@" symbol which ignores everything before it
        return 1 if "@" in self.url else 0

    def redirecting(self):
        # Checks for double slashes "//" in the wrong place (redirects)
        last_double_slash = self.url.rfind('//')
        return 1 if last_double_slash > 7 else 0

    def prefix_suffix(self):
        # Checks for "-" in the domain (phishers often use "paypal-secure.com")
        try:
            match = re.findall('\-', self.parsed_url.netloc)
            return 1 if match else 0
        except:
            return 0

    def sub_domains(self):
        # Checks for too many dots (subdomains)
        dots = self.url.count('.')
        if dots < 3:
            return 0
        elif dots == 3:
            return 1
        return 2

    def https_token(self):
        # Checks if "https" appears in the domain part (e.g., "http://https-secure.com")
        domain = self.parsed_url.netloc
        if 'https' in domain:
            return 1
        return 0