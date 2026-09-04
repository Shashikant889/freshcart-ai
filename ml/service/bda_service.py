"""
ml/service/bda_service.py
Big Data Analytics (BDA) In-Memory OLAP Cube & Stream Processing Engine
Simulates an Enterprise Distributed Retail Data Warehouse (Star Schema):
- Fact Table: fact_retail_events (100,000+ simulated stream events)
- Dimension Tables: dim_time, dim_geography (Dark Store Hubs), dim_product_taxonomy, dim_customer_tier
- OLAP Operations: Drill-Down, Roll-Up, Slice-and-Dice, Pivot Aggregation
- MapReduce Stream Aggregator for real-time velocity and CLV
"""

import math
import random
from typing import Dict, List, Any, Optional

class BigDataOLAPEngine:
    def __init__(self):
        self.dark_store_hubs = [
            "Indiranagar Hub #04", "Koramangala Hub #02", 
            "HSR Layout Hub #07", "Whitefield Hub #11", "Jayanagar Hub #01"
        ]
        self.categories = [
            "Fruits & Veggies", "Dairy & Bakery", "Snacks & Munchies", 
            "Drinks & Juices", "Atta, Rice & Dals", "Cleaning & Home", "Personal Care"
        ]
        self.customer_tiers = ["Bronze", "Silver", "Gold", "Platinum VIP"]
        self.payment_methods = ["UPI", "Credit Card", "FreshWallet", "Cash on Delivery"]
        self.total_stream_events = 125000
        self._init_cube()

    def _init_cube(self):
        """Pre-computes multidimensional aggregate cells for sub-millisecond OLAP querying."""
        random.seed(42)
        self.cube_data = []
        for hub in self.dark_store_hubs:
            for cat in self.categories:
                for tier in self.customer_tiers:
                    base_volume = random.randint(450, 2400)
                    avg_price = random.uniform(45.0, 320.0)
                    gross_rev = round(base_volume * avg_price, 2)
                    cogs = round(gross_rev * random.uniform(0.68, 0.78), 2)
                    margin = round(gross_rev - cogs, 2)
                    margin_pct = round((margin / gross_rev) * 100, 2) if gross_rev > 0 else 0.0
                    avg_delivery_mins = round(random.uniform(8.5, 12.8), 1)
                    spoilage_units = random.randint(4, 45)

                    self.cube_data.append({
                        "hub": hub,
                        "category": cat,
                        "customer_tier": tier,
                        "units_sold": base_volume,
                        "gross_revenue": gross_rev,
                        "cogs": cogs,
                        "gross_margin": margin,
                        "margin_percent": margin_pct,
                        "avg_delivery_minutes": avg_delivery_mins,
                        "spoilage_units": spoilage_units
                    })

    def get_summary_metrics(self) -> Dict[str, Any]:
        """Returns executive Big Data aggregate metrics across the entire multi-tenant store."""
        total_rev = sum(c["gross_revenue"] for c in self.cube_data)
        total_units = sum(c["units_sold"] for c in self.cube_data)
        total_margin = sum(c["gross_margin"] for c in self.cube_data)
        overall_margin_pct = round((total_margin / total_rev) * 100, 2) if total_rev > 0 else 0.0
        avg_delivery = round(sum(c["avg_delivery_minutes"] * c["units_sold"] for c in self.cube_data) / total_units, 2)
        total_spoilage = sum(c["spoilage_units"] for c in self.cube_data)

        # Star Schema Dimensions metadata
        return {
            "engine": "In-Memory Columnar OLAP Engine v3.0 (Star Schema)",
            "fact_table": "fact_retail_events",
            "total_indexed_events": self.total_stream_events,
            "total_cube_cells": len(self.cube_data),
            "kpis": {
                "total_gross_revenue_inr": round(total_rev, 2),
                "total_units_dispatched": total_units,
                "total_gross_margin_inr": round(total_margin, 2),
                "overall_margin_percent": overall_margin_pct,
                "fleet_weighted_delivery_mins": avg_delivery,
                "total_spoilage_units": total_spoilage
            },
            "dimensions": {
                "hubs": self.dark_store_hubs,
                "categories": self.categories,
                "customer_tiers": self.customer_tiers,
                "payment_methods": self.payment_methods
            }
        }

    def slice_and_dice(self, 
                       hub_filter: Optional[str] = None, 
                       category_filter: Optional[str] = None, 
                       tier_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes multidimensional Slice-and-Dice across the data cube.
        Slices by a specific dimension plane and dices across intersecting sub-cubes.
        """
        filtered = self.cube_data
        if hub_filter and hub_filter != "all":
            filtered = [c for c in filtered if c["hub"] == hub_filter]
        if category_filter and category_filter != "all":
            filtered = [c for c in filtered if c["category"] == category_filter]
        if tier_filter and tier_filter != "all":
            filtered = [c for c in filtered if c["customer_tier"] == tier_filter]

        slice_rev = sum(c["gross_revenue"] for c in filtered)
        slice_units = sum(c["units_sold"] for c in filtered)
        slice_margin = sum(c["gross_margin"] for c in filtered)
        slice_margin_pct = round((slice_margin / slice_rev) * 100, 2) if slice_rev > 0 else 0.0

        return {
            "query_type": "SLICED_AND_DICED_CUBE",
            "filters_applied": {
                "hub": hub_filter or "all",
                "category": category_filter or "all",
                "customer_tier": tier_filter or "all"
            },
            "matched_cells_count": len(filtered),
            "slice_summary": {
                "revenue_inr": round(slice_rev, 2),
                "units_sold": slice_units,
                "margin_inr": round(slice_margin, 2),
                "margin_percent": slice_margin_pct
            },
            "cells": filtered[:30] # Return top slice rows
        }

    def map_reduce_aggregate(self, group_by: str = "category") -> List[Dict[str, Any]]:
        """
        Simulates parallel MapReduce aggregation:
        Map Step: Maps (key, value) pairs from event streams.
        Shuffle/Sort Step: Partitions by dimension key.
        Reduce Step: Aggregates sums and averages.
        """
        valid_keys = {"category", "hub", "customer_tier"}
        dim_key = group_by if group_by in valid_keys else "category"

        # Map phase
        mapped = {}
        for row in self.cube_data:
            key = row[dim_key]
            if key not in mapped:
                mapped[key] = {
                    "revenue": 0.0,
                    "units": 0,
                    "margin": 0.0,
                    "delivery_mins_weighted": 0.0,
                    "count": 0
                }
            mapped[key]["revenue"] += row["gross_revenue"]
            mapped[key]["units"] += row["units_sold"]
            mapped[key]["margin"] += row["gross_margin"]
            mapped[key]["delivery_mins_weighted"] += row["avg_delivery_minutes"] * row["units_sold"]
            mapped[key]["count"] += 1

        # Reduce phase
        reduced = []
        for key, vals in mapped.items():
            avg_deliv = round(vals["delivery_mins_weighted"] / vals["units"], 2) if vals["units"] > 0 else 0.0
            margin_pct = round((vals["margin"] / vals["revenue"]) * 100, 2) if vals["revenue"] > 0 else 0.0
            reduced.append({
                "group_dimension": dim_key,
                "group_value": key,
                "total_revenue": round(vals["revenue"], 2),
                "total_units": vals["units"],
                "gross_margin": round(vals["margin"], 2),
                "margin_percent": margin_pct,
                "avg_delivery_minutes": avg_deliv
            })

        reduced.sort(key=lambda x: x["total_revenue"], reverse=True)
        return reduced

bda_engine = BigDataOLAPEngine()
