#######################################
## Code to scrape data using twitch API
#######################################
#set RDS username and password before runnning
import requests
import json
import urllib
import pandas as pd
import mysql.connector
from sqlalchemy import create_engine
import time
import logging
logger = logging.getLogger('twitchscraper')
hdlr = logging.FileHandler('/home/ubuntu/Project/twitchscraper.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
hdlr.setFormatter(formatter)
logger.addHandler(hdlr)
logger.setLevel(logging.DEBUG)


def get_url(game):
    game_encoded = urllib.quote_plus(game)
    return 'https://api.twitch.tv/kraken/search/streams?q='+game_encoded+'&limit=100&client_id=mesqfw54oaaufn3x28lcc59o329itq'

def get_game_url():
    return 'https://api.twitch.tv/kraken/games/top?limit=100&client_id=mesqfw54oaaufn3x28lcc59o329itq'


ts = time.time()
rowcount =-1

gamelist = ["League of Legends", "PLAYERUNKNOWN'S BATTLEGROUNDS", "Hearthstone", "Counter-Strike: Global Offensive", "Finding Bigfoot", "Dota 2", "Street Fighter V","Overwatch","Dark Souls III","Power Rangers","H1Z1: King of the Kill","Destiny","World of Warcraft","Poker","Arma 3","RuneScape","Talk Shows","Creative","Path of Exile","Smite","Grand Theft Auto V","The Legend of Zelda: Breath of the Wild","Minecraft","StarCraft II","Heroes of the Storm","IRL","Tom Clancy's Rainbow Six: Siege","For Honor","Casino","Mass Effect: Andromeda"]

stream_df = pd.DataFrame(columns=( 'stream_game' , 'timestamp' , 'rank' , 'stream_id' , 'average_fps' , 'viewers', 'video_height' , 'delay' , 'created_at' , 'is_playlist' , 'ch_broadcaster_language' , 'ch_mature' , 'ch_partner' , 'ch_status' , 'ch_display_name' , 'ch_channel_game' , 'ch_language' , 'ch_channel_id' , 'ch_channel_name' , 'ch_created_at' , 'ch_updated_at' , 'ch_channel_delay' , 'ch_views' , 'ch_followers',))
logger.info('Started streams scraping')
for game in gamelist:
    logger.info('streams: '+game)
    url = get_url(game)
    response = requests.get(url)
    parsed = json.loads(response.text)
    if 'streams' in parsed:
        count = 1
        for stream in parsed['streams']:
            try:
                rowcount = rowcount +1
                timestamp = int(ts)
                rank = count
                count = count + 1
                game = stream['game']
                stream_id = stream['_id']
                average_fps  = stream['average_fps']
                viewers  = stream['viewers']
                video_height  = stream['video_height']
                delay = stream['delay']
                created_at = stream['created_at']
                is_playlist = stream['is_playlist']

                channel = stream['channel']
                broadcaster_language = channel['broadcaster_language']
                mature = channel['mature']
                partner = channel['partner']
                status = channel['status']
                display_name = channel['display_name']
                channel_game = channel['game']
                language = channel['language']
                channel_id = channel['_id']
                channel_name = channel['name']
                created_at = channel['created_at']
                updated_at = channel['updated_at']
                channel_delay = channel['delay']
                views = channel['views']
                followers = channel['followers']
                stream_df.loc[rowcount] = [game, timestamp, rank, stream_id, average_fps, viewers, video_height, delay, created_at, is_playlist, broadcaster_language, mature, partner, status, display_name, channel_game, language, channel_id, channel_name, created_at, updated_at, channel_delay, views, followers]
            except:
                logger.error('streams cleaning error')
    else:
        logger.error('streams not found')

rowcount =-1
game_df = pd.DataFrame(columns=('timestamp' , 'rank' , 'name' , 'popularity' , 'game_id', 'giantbomb_id' , 'viewers' , 'channels' ))
logger.info('Started games scraping')
url = get_game_url()
response = requests.get(url)
parsed = json.loads(response.text)
if 'top' in parsed:
    count = 1
    for entry in parsed['top']:
        try:
            game = entry['game']
            rowcount = rowcount +1
            timestamp = int(ts)
            rank = count
            count = count + 1
            name = game['name']
            popularity = int(game['popularity'])
            game_id = int(game['_id'])
            giantbomb_id = int(game['giantbomb_id'])
            viewers = int(entry['viewers'])
            channels = int(entry['channels'])
            game_df.loc[rowcount] = [timestamp, rank, name, popularity,game_id,giantbomb_id,viewers,channels]
        except:
            logger.error('Failed game data')


engine = create_engine('mysql+mysqlconnector://username:password@rds.amazonaws.com:3306/twitch', echo=False)

stream_df.to_sql(name='streams', con=engine, if_exists = 'append', index=False)

game_df.to_sql(name='games', con=engine, if_exists = 'append', index=False)
