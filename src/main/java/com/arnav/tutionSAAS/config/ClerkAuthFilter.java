package com.arnav.tutionSAAS.config;

import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.UserRepo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Runs AFTER Spring's JWT validation filter. Resolves the user's role
 * from our database (using the clerkId from the JWT 'sub' claim) and
 * replaces the authentication with one that includes ROLE_ authorities.
 *
 * Blocked users are still authenticated normally — the frontend reads
 * the 'blocked' flag from GET /api/users/me and shows the blocked message.
 * This allows blocked students to still reach /api/users/me without getting
 * a 401, while any further business actions can check blocked status as needed.
 */
@Component
public class ClerkAuthFilter extends OncePerRequestFilter {

    @Autowired
    private UserRepo userRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String clerkId = jwt.getSubject();

            Optional<User> userOpt = userRepo.findByClerkId(clerkId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String role = "ROLE_" + user.getRole().name(); // e.g. ROLE_PARENT

                UsernamePasswordAuthenticationToken newAuth =
                        new UsernamePasswordAuthenticationToken(
                                jwt,
                                null,
                                List.of(new SimpleGrantedAuthority(role))
                        );

                SecurityContextHolder.getContext().setAuthentication(newAuth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
