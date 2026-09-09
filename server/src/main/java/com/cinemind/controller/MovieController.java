package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.dto.MovieDto;
import com.cinemind.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<MovieDto>>> searchMovies(
            @RequestParam("q") String query,
            @RequestParam(value = "page", defaultValue = "1") int page
    ) {
        List<MovieDto> results = movieService.searchMovies(query, page);
        return ResponseEntity.ok(ApiResponse.of(results));
    }

    @GetMapping("/semantic-search")
    public ResponseEntity<ApiResponse<List<MovieDto>>> searchSemantic(
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit
    ) {
        List<MovieDto> results = movieService.searchSemantic(query, limit);
        return ResponseEntity.ok(ApiResponse.of(results));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<MovieDto>>> getTrending(
            @RequestParam(value = "page", defaultValue = "1") int page
    ) {
        List<MovieDto> results = movieService.getTrending(page);
        return ResponseEntity.ok(ApiResponse.of(results));
    }

    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<MovieDto>>> getPopular(
            @RequestParam(value = "page", defaultValue = "1") int page
    ) {
        List<MovieDto> results = movieService.getPopular(page);
        return ResponseEntity.ok(ApiResponse.of(results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MovieDto>> getMovieDetails(@PathVariable("id") String id) {
        MovieDto movie = movieService.getMovieDetails(id);
        return ResponseEntity.ok(ApiResponse.of(movie));
    }
}
