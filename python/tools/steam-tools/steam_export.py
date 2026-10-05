import csv
import requests

from private_config import STEAM_API_KEY, STEAM_VANITY_NAME


def get_steam_id64():
    url = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/"

    params = {
        "key": STEAM_API_KEY,
        "vanityurl": STEAM_VANITY_NAME
    }

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()

    data = response.json()["response"]

    if data.get("success") != 1:
        raise RuntimeError(
            f"Could not resolve Steam vanity name: {STEAM_VANITY_NAME}"
        )

    return data["steamid"]


def get_owned_games(steam_id):
    url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"

    params = {
        "key": STEAM_API_KEY,
        "steamid": steam_id,
        "include_appinfo": True,
        "include_played_free_games": True,
        "format": "json"
    }

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()

    data = response.json()

    return data.get("response", {}).get("games", [])


def export_games(games, filename="steam_games.csv"):
    games.sort(key=lambda game: game.get("name", "").lower())

    with open(filename, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow([
            "Game",
            "AppID",
            "Playtime Hours",
            "Playtime Last 2 Weeks Hours"
        ])

        for game in games:
            writer.writerow([
                game.get("name", ""),
                game.get("appid", ""),
                round(game.get("playtime_forever", 0) / 60, 1),
                round(game.get("playtime_2weeks", 0) / 60, 1)
            ])


def main():
    print(f"Resolving Steam user: {STEAM_VANITY_NAME}")

    steam_id = get_steam_id64()

    print(f"SteamID64: {steam_id}")
    print("Retrieving game library...")

    games = get_owned_games(steam_id)

    if not games:
        print()
        print("No games were returned.")
        print("Check that your Steam profile and Game Details are visible.")
        return

    export_games(games)

    print()
    print(f"Exported {len(games)} games.")
    print("Created: steam_games.csv")


if __name__ == "__main__":
    main()