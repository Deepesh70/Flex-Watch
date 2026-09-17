import pickle
import json
import pandas as pd
import os

def load_data():
    print("Loading pickle files...")
    
    try:
        with open('movies_dict.pkl', 'rb') as f:
            movies_dict = pickle.load(f)
            
        with open('similarity.pkl', 'rb') as f:
            similarity = pickle.load(f)
            
        # Handle if movies_dict is a DataFrame or a dict
        if isinstance(movies_dict, pd.DataFrame):
            movies = movies_dict
        else:
            movies = pd.DataFrame(movies_dict)

        print(f"Loaded {len(movies)} movies.")
        return movies, similarity
    except Exception as e:
        print(f"Error loading files: {e}")
        raise

def generate_recommendations(movies, similarity):
    recommendations = {}
    
    print("Generating recommendations...")
    
    # Ensure 'title' column exists
    if 'title' not in movies.columns:
        # Try finding a column that looks like a title
        possible_cols = [c for c in movies.columns if 'title' in c.lower()]
        if possible_cols:
            movies.rename(columns={possible_cols[0]: 'title'}, inplace=True)
        else:
            print("Error: Could not find 'title' column in movies data.")
            print(f"Available columns: {movies.columns}")
            return {}

    # Identify stable movie identifier column if available
    id_col = None
    for candidate in ['movie_id', 'id', 'tmdbId', 'tmdb_id']:
        if candidate in movies.columns:
            id_col = candidate
            break

    for pos, (index, row) in enumerate(movies.iterrows()):
        movie_title = row['title']
        movie_key = str(row[id_col]) if id_col is not None and pd.notna(row.get(id_col)) else movie_title
        
        try:
            distances = similarity[pos]
            movies_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:6]
            
            recommended_movies = []
            for i in movies_list:
                recommended_movies.append(movies.iloc[i[0]].title)
                
            recommendations[movie_key] = recommended_movies
        except Exception as e:
            print(f"Skipping {movie_title} (position {pos}) due to error: {e}")
            continue
            
    return recommendations

def save_to_json(data):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'data'))
    os.makedirs(target_dir, exist_ok=True)
    output_path = os.path.join(target_dir, 'recommendations.json')
    print(f"Saving to {output_path}...")
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print("Done! Recommendations exported to backend data.")

if __name__ == "__main__":
    movies, similarity = load_data()
    if movies is not None:
        rec_data = generate_recommendations(movies, similarity)
        if rec_data:
            save_to_json(rec_data)
