import { redirectToSpotifyLogin } from '../auth/spotifyAuth';
import './LoginScreen.css';

export function LoginScreen() {
  return (
    <div className="login-screen">
      <p className="login-screen__wordmark">drift</p>
      <p className="login-screen__tagline">your music, given somewhere calm to live</p>
      <button className="login-screen__button" onClick={redirectToSpotifyLogin}>
        Connect Spotify
      </button>
    </div>
  );
}
