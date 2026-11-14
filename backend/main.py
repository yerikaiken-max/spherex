from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from astropy.coordinates import SkyCoord
import astropy.units as u
import numpy as np

app = FastAPI(title="SPHEREx Discovery API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Челлендж талабы бойынша міндетті 5 тестовый нысан
TARGET_CATALOG = {
    "wise0855": {
        "name": "WISE 0855 (Brown Dwarf)",
        "ra": "08h55m10.831s",
        "dec": "-7d14m42.53s",
        "type": "Fast-moving Cold Brown Dwarf",
        "motion_ra": 0.45,
        "motion_dec": -0.18,
        "var_amp": 0.05,
        "chem_signature": "Water Ice & Methane (H2O, CH4)"
    },
    "barnard": {
        "name": "Barnard's Star",
        "ra": "17h57m48.498s",
        "dec": "+04d41m36.11s",
        "type": "High Proper-Motion Red Dwarf",
        "motion_ra": -0.22,
        "motion_dec": 0.65,
        "var_amp": 0.02,
        "chem_signature": "Hydrogen & Metal Hydrides"
    },
    "epsilon_indi": {
        "name": "Epsilon Indi B",
        "ra": "22h04m10.52s",
        "dec": "-56d46m57.7s",
        "type": "Binary Brown Dwarf System",
        "motion_ra": 0.35,
        "motion_dec": -0.25,
        "var_amp": 0.12,
        "chem_signature": "Ammonia & Carbon Monoxide (NH3, CO)"
    },
    "rw_aurigae": {
        "name": "RW Aurigae",
        "ra": "05h07m49.54s",
        "dec": "+30d24m05.1s",
        "type": "Young Variable Star (Accretion)",
        "motion_ra": 0.02,
        "motion_dec": -0.01,
        "var_amp": 0.75,
        "chem_signature": "Silicate Dust & Water Vapor"
    },
    "r_draconis": {
        "name": "R Draconis",
        "ra": "16h32m40.23s",
        "dec": "+66d45m17.9s",
        "type": "Mira-type Pulsating Variable",
        "motion_ra": -0.01,
        "motion_dec": 0.02,
        "var_amp": 0.85,
        "chem_signature": "Carbon Dioxide & H2O Ice Bands"
    }
}

def generate_102_bands(seed: int, chem_type: str):
    """SPHEREx 102 жақын инфрақызыл толқын ұзындығын (0.75 - 5.0 μm) модельдеу"""
    rng = np.random.default_rng(seed)
    wavelengths = np.linspace(0.75, 5.0, 102)
    flux = 1.0 + 0.15 * np.sin(wavelengths * 2.5) + rng.normal(0, 0.03, 102)
    
    if "Water" in chem_type or "H2O" in chem_type:
        flux -= 0.35 * np.exp(-((wavelengths - 1.4) ** 2) / 0.02)
        flux -= 0.45 * np.exp(-((wavelengths - 3.05) ** 2) / 0.04)
    if "Carbon" in chem_type or "CO" in chem_type:
        flux -= 0.40 * np.exp(-((wavelengths - 4.26) ** 2) / 0.03)
    if "Methane" in chem_type:
        flux -= 0.38 * np.exp(-((wavelengths - 3.3) ** 2) / 0.03)

    return [
        {"band": i + 1, "wavelength": round(float(w), 3), "flux": round(max(0.1, float(f)), 4)}
        for i, (w, f) in enumerate(zip(wavelengths, flux))
    ]

@app.get("/api/sky-patch")
def get_sky_patch(ra: str, dec: str, fov: float = 1.0):
    try:
        coord = SkyCoord(f"{ra} {dec}", unit=(u.hourangle, u.deg))
        ra_deg = round(float(coord.ra.deg), 5)
        dec_deg = round(float(coord.dec.deg), 5)

        matched_target = None
        for key, item in TARGET_CATALOG.items():
            t_coord = SkyCoord(f"{item['ra']} {item['dec']}", unit=(u.hourangle, u.deg))
            if coord.separation(t_coord).deg < 0.5:
                matched_target = item
                break

        if not matched_target:
            matched_target = {
                "name": f"Custom Field ({ra_deg}°, {dec_deg}°)",
                "type": "Unclassified IR Candidate",
                "motion_ra": 0.25,
                "motion_dec": 0.15,
                "var_amp": 0.20,
                "chem_signature": "Mixed H2O / CO Ice Signature"
            }

        epochs_labels = ["2025-05 (Epoch 1)", "2025-11 (Epoch 2)", "2026-05 (Epoch 3)", "2026-11 (Epoch 4)"]
        epochs = []
        for idx, label in enumerate(epochs_labels):
            epochs.append({
                "epoch_index": idx,
                "date": label,
                "dx": round(matched_target["motion_ra"] * idx, 3),
                "dy": round(matched_target["motion_dec"] * idx, 3),
                "brightness": round(1.0 + matched_target["var_amp"] * np.sin(idx * 1.3), 3),
                "contamination_flag": "CLEAN" if idx != 2 else "ZODIACAL_LIGHT_WARN"
            })

        seed = int(abs(ra_deg * 100 + dec_deg * 10))
        spectrum_102 = generate_102_bands(seed, matched_target["chem_signature"])

        return {
            "status": "success",
            "coordinates": {"ra_str": ra, "dec_str": dec, "ra_deg": ra_deg, "dec_deg": dec_deg, "fov": fov},
            "object_info": matched_target,
            "epochs": epochs,
            "spectrum_102": spectrum_102
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Координата форматы қате: {str(e)}")