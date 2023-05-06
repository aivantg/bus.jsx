import React, { Component } from "react";
import { render } from "react-dom";
import logo from "./logo.svg";
import "./App.css";
import ListRoutes from "./ListRoutes.jsx";
import InfoPanel from "./InfoPanel.jsx";
import Info from "./Info.jsx";
import StopList from "./StopList.jsx";
import { Map, InfoWindow, Marker, GoogleApiWrapper } from "google-maps-react";
import "./../node_modules/fomantic-ui/dist/semantic.min.css";

const AC_TRANSIT_API_BASE_URL = "https://api.actransit.org/transit/";

export class MapContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buses: null,
      current_route: null,
      current_bus_info: null,
      stops: null,
      useCourtneyIcon: false,
    };
    window.addEventListener("keyup", (e) => {
      console.log("keyup");
      console.log(e.key);
      if (e.key === " " || e.code === "Space" || e.keyCode === 32) {
        this.setState((prevState) => ({
          useCourtneyIcon: !prevState.useCourtneyIcon,
        }));
      }
    });
  }

  async fetchBuses() {
    let route = this.state.current_route;
    // Fetches buses for a specified route from the AC Transit API and updates the buses in state
    if (route) {
      let url =
        AC_TRANSIT_API_BASE_URL +
        "route/" +
        route +
        "/vehicles/?token=" +
        process.env.REACT_APP_AC_TRANSIT_API_KEY;
      try {
        let response = await fetch(url);
        let responseJSON = await response.json();
        console.log(responseJSON);
        this.setState({ buses: responseJSON });
      } catch (error) {
        console.log(error);
        // TODO: Make into a more noticeable failure messsage
        console.log("The API seems to be down right now. Try again later!");
      }
    }
  }

  async getStops() {
    let route = this.state.current_route;
    let bus = this.state.current_bus_info["CurrentTripId"];
    // Fetches buses for a specified route from the AC Transit API and updates the buses in state
    if (route) {
      let url =
        AC_TRANSIT_API_BASE_URL +
        "route/" +
        route +
        "/trip/" +
        bus +
        "/stops/?token=" +
        process.env.REACT_APP_AC_TRANSIT_API_KEY;
      let response = await fetch(url);
      let responseJSON = await response.json();
      this.setState({ stops: responseJSON });
    }
  }

  componentDidMount() {
    this.interval = setInterval(
      () => this.fetchBuses(this.state.current_route),
      5000
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  updateCurrentRoute(route) {
    // Updates the current_route in state and then calls fetchBuses to get new bus locations
    this.setState({ current_route: route, stops: null }, this.fetchBuses);
  }

  onMarkerClick(busInfo) {
    this.setState({ current_bus_info: busInfo }, this.getStops);
  }

  render() {
    const { google } = this.props;

    let info_style = {
      width: "25%",
    };

    let map_style = {
      width: "70%",
      float: "right",
    };

    let top_level_style = {
      display: "flex",
    };

    return (
      <div style={top_level_style}>
        <div style={info_style}>
          <div>
            <ListRoutes
              onClick={(route) => this.updateCurrentRoute(route)}
              onHeaderClick={() => {
                this.setState((prevState) => ({
                  useCourtneyIcon: !prevState.useCourtneyIcon,
                }));
              }}
            />
          </div>
          <div>
            <InfoPanel>
              <div label="Info">
                <Info
                  busInfo={this.state.current_bus_info}
                  stops={this.state.stops}
                  currentRoute={this.state.current_route}
                />
              </div>
              <div label="Stops">
                <StopList stops={this.state.stops} />
              </div>
            </InfoPanel>
          </div>
        </div>
        <div style={map_style}>
          <Map
            google={this.props.google}
            initialCenter={{
              lat: 37.8719,
              lng: -122.2585,
            }}
            zoom={13}
          >
            {
              // Maps the bus route data passed in
              this.state.buses &&
                this.state.buses.map((b) => (
                  <Marker
                    onClick={(e) => this.onMarkerClick(b)}
                    key={b.CurrentTripId}
                    position={{ lat: b.Latitude, lng: b.Longitude }}
                    icon={{
                      url: this.state.useCourtneyIcon
                        ? "courtney_icon.png"
                        : "bus_icon.png",
                      scaledSize: new google.maps.Size(20, 20),
                    }}
                  />
                ))
            }

            <InfoWindow onClose={this.onInfoWindowClose}>
              <div>
                <h1>Placeholder for state</h1>
              </div>
            </InfoWindow>
          </Map>
        </div>
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
})(MapContainer);
