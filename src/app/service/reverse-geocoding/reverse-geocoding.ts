export class ReverseGeocoding {
  constructor(
    public originLatLng: [number, number],
    public codedLatLon: [number, number],
    public name?: string,
    public displayName?: string,
    public category?: string,
    public type?: string,
    public road?: string,
    public houseNumber?: string,
    public postcode?: string,
    public village?: string,
    public town?: string,
    public city?: string,
    public hamlet?: string,
    public stateDistrict?: string,
    public state?: string,
    public county?: string,
    public country?: string,
    public countryCode?: string
  ) {}

  static fromApiObject(
    val: any,
    originLatLng: [number, number]
  ): ReverseGeocoding {
    const {
      lat,
      lon,
      name,
      display_name,
      category,
      type,
      address: {
        road,
        village,
        town,
        city,
        state_district,
        state,
        postcode,
        county,
        country,
        country_code,
        house_number,
        hamlet,
      },
    } = val

    return new ReverseGeocoding(
      originLatLng,
      [Number(lat), Number(lon)],
      name,
      display_name,
      category,
      type,
      road,
      house_number,
      postcode,
      town,
      village,
      city,
      hamlet,
      state_district,
      state,
      county,
      country,
      country_code
    )
  }

  get addressDisplayName(): string {
    const name = this.name ? `${this.name}, ` : ''
    const road = this.road ? `${this.road} ` : ''
    const houseNumber = this.houseNumber ? this.houseNumber : ''
    const location =
      this.city || this.town || this.village || this.country || ''
    const locationString = location.length > 0 ? ` (${location})` : location

    const displayName = `${name}${road}${houseNumber}${locationString}`
    if (displayName.trim().length > 0) return displayName

    return undefined
  }
}
