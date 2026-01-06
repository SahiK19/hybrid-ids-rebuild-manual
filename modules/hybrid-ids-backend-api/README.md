# Hybrid IDS Backend API

## Overview
This repository contains the backend API for the Hybrid Intrusion Detection System (IDS).
It processes alerts from Snort, Wazuh, and the correlation engine, stores them in the database,
and exposes APIs for the dashboard.

## System Role
- Deployed on Backend EC2 instance
- Receives alerts via REST API
- Provides data to the web dashboard

## Prerequisites
- Ubuntu 20.04 or later
- Python 3.9+
- Network access from IDS agents

## Installation --(DO THIS)
git clone https://github.com/SahiK19/hybrid-ids-backend-api.git  
cd hybrid-ids-backend-api  
pip3 install -r requirements.txt  

## Running the API
python3 app.py

## Ports
- 5000: Backend API

## Security
API requests are protected using an API key header.
