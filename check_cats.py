#!/usr/bin/env python3
import urllib.request
import json

url = "https://api.storyblok.com/v1/cdn/stories?token=VdLWwVoZVAbmH4X3E93rhwtt&version=draft&starts_with=categories/&per_page=100"
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read().decode())
    for story in data['stories']:
        if not story.get('parent_id') or story.get('parent_id') == 0:
            print(f"{story['slug']}: {story['uuid']}")
